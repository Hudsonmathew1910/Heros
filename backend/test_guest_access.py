"""Guest (non-login) access rules: main chat + Infinsight. Run: python manage.py test backend.test_guest_access"""
import json
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import TestCase, TransactionTestCase, Client
from django.utils import timezone

from backend.models import User
from infinsight.models import ProjectSession, UploadedFile


def chat(client, **body):
    payload = {"message": "hello there", "model": "Baymax", "mode": "text"}
    payload.update(body)
    r = client.post("/api/chat", data=json.dumps(payload), content_type="application/json")
    return r.status_code, r.json()


class FakeBaymax:
    def __init__(self, **kw):
        self.kw = kw
        FakeBaymax.last_kwargs = kw

    def handle_text(self, m):
        return "hi from baymax"

    handle_voice_chat = handle_text


class MainChatGuestTests(TestCase):
    def setUp(self):
        cache.clear()
        p = mock.patch("backend.views.Baymax", FakeBaymax)
        p.start(); self.addCleanup(p.stop)

    def test_halo_blocked(self):
        _, d = chat(Client(), model="Halo")
        self.assertTrue(d.get("login_required"))
        self.assertIn("Halo", d["reply"])

    def test_search_code_files_dev_blocked(self):
        for extra in ({"mode": "websearch"}, {"mode": "coding"}, {"mode": "file_handle"},
                      {"mode": "zeno_plus"}, {"is_developer": True}):
            _, d = chat(Client(), **extra)
            self.assertTrue(d.get("login_required"), extra)

    def test_guest_gets_no_search_and_no_fast(self):
        _, d = chat(Client(), is_fast=True)
        self.assertEqual(d["reply"], "hi from baymax")
        self.assertFalse(FakeBaymax.last_kwargs["allow_search"])
        self.assertFalse(FakeBaymax.last_kwargs["is_fast"])

    def test_five_messages_then_limit_and_ip_tracking(self):
        c = Client()
        for i in range(5):
            _, d = chat(c)
            self.assertEqual(d["reply"], "hi from baymax")
            self.assertEqual(d["guest_remaining"], 4 - i)
        _, d = chat(c)
        self.assertTrue(d.get("limit_reached"))
        # New browser (no cookie) from the same IP is still blocked
        _, d = chat(Client())
        self.assertTrue(d.get("limit_reached"))
        # Different IP, new browser → fresh allowance
        _, d = chat(Client(REMOTE_ADDR="10.9.9.9"))
        self.assertEqual(d["reply"], "hi from baymax")

    def test_spoofed_forwarded_for_does_not_reset(self):
        c = Client()
        for _ in range(5):
            chat(c)
        # Left-most XFF entry is client-controlled; right-most (our proxy) is used
        _, d = chat(Client(HTTP_X_FORWARDED_FOR="1.2.3.4, 127.0.0.1"))
        self.assertTrue(d.get("limit_reached"))

    def test_failed_reply_not_counted(self):
        class Boom(FakeBaymax):
            def handle_text(self, m):
                raise RuntimeError("x")
            handle_voice_chat = handle_text
        with mock.patch("backend.views.Baymax", Boom):
            _, d = chat(Client())
        self.assertEqual(d["guest_remaining"], 5)

    def test_rate_limit_json(self):
        c = Client(REMOTE_ADDR="10.1.1.1")
        for _ in range(10):
            chat(c, model="Halo")
        code, d = chat(c)
        self.assertEqual(code, 200)
        self.assertIn("too quickly", d["reply"])

    def test_transcribe_requires_login(self):
        r = Client().post("/api/transcribe", data=b"{}", content_type="application/json")
        self.assertEqual(r.status_code, 401)

class MainChatLoggedInTests(TransactionTestCase):
    def setUp(self):
        cache.clear()
        p = mock.patch("backend.views.Baymax", FakeBaymax)
        p.start(); self.addCleanup(p.stop)

    def test_logged_in_user_unaffected(self):
        u = User.objects.create(name="A B", email="a@b.co", password_hash="x")
        c = Client()
        s = c.session; s["user_id"] = str(u.user_id); s.save()
        with mock.patch("backend.views._db_executor"):
            _, d = chat(c, model="Baymax", mode="text")
        self.assertNotIn("login_required", d)
        self.assertTrue(FakeBaymax.last_kwargs["allow_search"])



def fake_query(session, msg, key, history):
    yield {"type": "final", "reply": "answer", "model": "m", "sources": [], "error": None}


class InfinsightGuestTests(TestCase):
    def setUp(self):
        cache.clear()
        for target, kw in [
            ("infinsight.views.get_session_title", {"return_value": "Title"}),
            ("infinsight.views._ingest_executor", {}),
            ("infinsight.guest.get_server_free_key", {"return_value": "SERVER"}),
            ("infinsight.views.query_session", {"side_effect": fake_query}),
            ("infinsight.views.cleanup_session", {}),
            ("infinsight.Rag.cleanup_session", {}),
        ]:
            p = mock.patch(target, **kw); p.start(); self.addCleanup(p.stop)

    def upload(self, c, size=100, name="d.csv"):
        f = SimpleUploadedFile(name, b"a,b\n" + b"1" * size, content_type="text/csv")
        r = c.post("/infinsight/upload/", {"file": f})
        return r.status_code, r.json()

    def ask(self, c, sid):
        r = c.post("/infinsight/chat/", data=json.dumps({"session_id": sid, "message": "q"}),
                   content_type="application/json")
        if r.status_code != 200:
            return r.status_code, r.json()
        body = b"".join(r.streaming_content).decode()
        return 200, json.loads(body.split("data: ", 1)[1])

    def status(self, c):
        return c.get("/infinsight/guest/status/").json()

    def test_free_tier_flow(self):
        c = Client()
        st = self.status(c)
        self.assertEqual((st["free_uploads_left"], st["free_messages_left"], st["key_source"]), (1, 5, "free"))

        # >5MB rejected on free tier
        code, d = self.upload(c, size=6 * 1024 * 1024)
        self.assertEqual(code, 400)

        code, d = self.upload(c)
        self.assertEqual(code, 200, d)
        sid = d["session"]["session_id"]
        self.assertIsNotNone(d["session"]["expires_at"])
        ps = ProjectSession.objects.get(session_id=sid)
        self.assertIsNone(ps.user)
        self.assertTrue(ps.pinecone_namespace.startswith("infinsight_guest"))
        ps.status = "ready"; ps.save()

        code, d = self.upload(c)
        self.assertEqual((code, d["code"]), (402, "free_limit"))

        for i in range(5):
            code, d = self.ask(c, sid)
            self.assertEqual(d["free_messages_left"], 4 - i)
        code, d = self.ask(c, sid)
        self.assertEqual((code, d["code"]), (402, "free_limit"))

        # Other guests cannot see it
        self.assertEqual(Client(REMOTE_ADDR="10.2.2.2").get("/infinsight/sessions/").json()["sessions"], [])

        # Guest adds own key → unlimited
        with mock.patch("infinsight.guest.validate_gemini_key", return_value=True):
            r = c.post("/infinsight/guest/key/", data=json.dumps({"gemini": "AIzaX"}), content_type="application/json")
        self.assertEqual(r.json()["status"], "success")
        self.assertEqual(self.status(c)["key_source"], "guest")
        code, d = self.ask(c, sid)
        self.assertEqual(code, 200)
        self.assertNotIn("free_messages_left", d)
        code, d = self.upload(c)
        self.assertEqual(code, 200)

        # Login within 24 h → sessions move to the account and become permanent
        u = User.objects.create(name="A B", email="a@b.co", password_hash="x")
        s = c.session; s["user_id"] = str(u.user_id); s.save()
        sessions = c.get("/infinsight/sessions/").json()["sessions"]
        self.assertEqual(len(sessions), 2)
        self.assertTrue(all(x["expires_at"] is None for x in sessions))
        self.assertEqual(ProjectSession.objects.filter(user=u).count(), 2)
        # Logged in, guest key still usable
        code, d = self.ask(c, sid)
        self.assertEqual(code, 200)

    def test_expired_guest_session_not_claimed_on_login(self):
        c = Client()
        code, d = self.upload(c)
        sid = d["session"]["session_id"]
        ProjectSession.objects.filter(session_id=sid).update(expires_at=timezone.now() - timedelta(minutes=1))
        u = User.objects.create(name="A B", email="e@b.co", password_hash="x")
        s = c.session; s["user_id"] = str(u.user_id); s.save()
        self.assertEqual(c.get("/infinsight/sessions/").json()["sessions"], [])
        self.assertIsNone(ProjectSession.objects.get(session_id=sid).user)

    def test_bad_key_rejected(self):
        with mock.patch("infinsight.guest.validate_gemini_key", return_value=False):
            r = Client().post("/infinsight/guest/key/", data=json.dumps({"gemini": "bad"}), content_type="application/json")
        self.assertEqual(r.status_code, 400)

    def test_purge_expired(self):
        from infinsight.guest import purge_expired_guest_data
        c = Client()
        code, d = self.upload(c)
        sid = d["session"]["session_id"]
        ProjectSession.objects.filter(session_id=sid).update(expires_at=timezone.now() - timedelta(minutes=1))
        # Expired sessions are hidden immediately, even before purge
        self.assertEqual(c.get("/infinsight/sessions/").json()["sessions"], [])
        self.assertEqual(purge_expired_guest_data(), 1)
        self.assertFalse(ProjectSession.objects.filter(session_id=sid).exists())
        self.assertFalse(UploadedFile.objects.exists())

    def test_logged_in_without_key_still_needs_key(self):
        u = User.objects.create(name="A B", email="c@b.co", password_hash="x")
        c = Client()
        s = c.session; s["user_id"] = str(u.user_id); s.save()
        code, d = self.upload(c)
        self.assertEqual(code, 400)
        self.assertIn("Gemini", d["message"])
