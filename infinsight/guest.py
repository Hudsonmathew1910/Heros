"""
infinsight/guest.py
-------------------
Guest (non-login) support for Infinsight.

Rules
  • No own Gemini key  → 1 free upload (max 5 MB) + 5 free messages, on the server key.
  • Own Gemini key     → unlimited uploads/chat. Key kept encrypted in the Django
                         session only (never in the DB), valid for 24 hours.
  • Guest data (files, vectors, chats) is deleted 24 h after upload — unless the guest
    logs in before then, in which case it moves to their account and is kept.
"""

import logging
import os
import time
from datetime import timedelta

from django.core.cache import cache
from django.db.models import Q
from django.utils import timezone

from backend.encryption import encrypt_api_key, decrypt_api_key

logger = logging.getLogger("infinsight.guest")

GUEST_TTL = timedelta(hours=24)
GUEST_FREE_MAX_FILE_MB = 5
GUEST_KEY_SESSION_FIELD = "inf_guest_gemini"


# ─────────────────────────────────────────────────────────────────────────────
# Guest Gemini key (session only)
# ─────────────────────────────────────────────────────────────────────────────

def get_guest_key(request) -> str | None:
    data = request.session.get(GUEST_KEY_SESSION_FIELD)
    if not data:
        return None
    if data.get("exp", 0) < time.time():
        request.session.pop(GUEST_KEY_SESSION_FIELD, None)
        return None
    return decrypt_api_key(data.get("k")) or None


def set_guest_key(request, key: str) -> None:
    request.session[GUEST_KEY_SESSION_FIELD] = {
        "k": encrypt_api_key(key),
        "exp": time.time() + GUEST_TTL.total_seconds(),
    }


def clear_guest_key(request) -> None:
    request.session.pop(GUEST_KEY_SESSION_FIELD, None)


def validate_gemini_key(key: str) -> bool:
    """Cheap check: list models with the key."""
    import urllib.request
    import urllib.error
    url = f"https://generativelanguage.googleapis.com/v1beta/models?key={key}&pageSize=1"
    try:
        with urllib.request.urlopen(urllib.request.Request(url), timeout=8) as resp:
            return resp.status == 200
    except urllib.error.HTTPError:
        return False
    except Exception as e:
        logger.warning("Gemini key validation network error: %s", e)
        return False


def get_server_free_key() -> str | None:
    """Server-owned Gemini key used only for the guest free tier."""
    for name in ("Gemini_K1", "Gemini_K2", "GEMINI_API_KEY"):
        v = os.getenv(name)
        if v:
            return v.strip("'\" ")
    return None


# ─────────────────────────────────────────────────────────────────────────────
# Ownership
# ─────────────────────────────────────────────────────────────────────────────

def not_expired_q() -> Q:
    return Q(expires_at__isnull=True) | Q(expires_at__gt=timezone.now())


def claim_guest_data(user, guest_id: str) -> None:
    """
    After login, move this browser's (not yet expired) guest sessions/files into the
    account and make them permanent — they are no longer auto-deleted.
    """
    if not user or not guest_id:
        return
    from .models import ProjectSession, UploadedFile
    n = ProjectSession.objects.filter(
        not_expired_q(), user__isnull=True, anon_key=guest_id,
    ).update(user=user, expires_at=None)
    UploadedFile.objects.filter(user__isnull=True, anon_key=guest_id, session__user=user).update(user=user)
    if n:
        logger.info("Moved %s guest Infinsight session(s) to user %s", n, user.user_id)


# ─────────────────────────────────────────────────────────────────────────────
# Cleanup
# ─────────────────────────────────────────────────────────────────────────────

def purge_expired_guest_data() -> int:
    """Delete expired guest sessions: Pinecone vectors, files on disk, DB rows. Returns count."""
    from backend.models import AnonymousUsage
    from .models import ProjectSession, UploadedFile
    from .Rag import cleanup_session

    now = timezone.now()
    count = 0

    for session in ProjectSession.objects.filter(expires_at__lt=now).select_related("uploaded_file"):
        try:
            cleanup_session(session)  # Pinecone namespace
        except Exception as e:
            logger.warning("Pinecone cleanup failed for %s: %s", session.session_id, e)
        _delete_file_record(session.uploaded_file)  # cascades to session + messages
        count += 1

    # Guest files whose session was never created (upload crashed half-way)
    for f in UploadedFile.objects.filter(
        user__isnull=True, session__isnull=True, created_at__lt=now - GUEST_TTL
    ):
        _delete_file_record(f)

    # Day-scoped IP counters older than 2 days are useless
    AnonymousUsage.objects.filter(user_key__contains="_ip_", updated_at__lt=now - timedelta(days=2)).delete()

    if count:
        logger.info("Purged %s expired guest Infinsight session(s)", count)
    return count


def _delete_file_record(file_record) -> None:
    try:
        if file_record.file and os.path.exists(file_record.file.path):
            os.remove(file_record.file.path)
    except Exception as e:
        logger.warning("Could not delete guest file from disk: %s", e)
    try:
        file_record.delete()
    except Exception as e:
        logger.warning("Could not delete guest file record: %s", e)


def maybe_purge_in_background(executor) -> None:
    """Run the purge at most once every 30 minutes per process (no cron required)."""
    if cache.add("infinsight_guest_purge_lock", 1, timeout=1800):
        executor.submit(_purge_safely)


def _purge_safely():
    from django.db import close_old_connections
    close_old_connections()
    try:
        purge_expired_guest_data()
    except Exception as e:
        logger.error("Guest purge failed: %s", e, exc_info=True)
    finally:
        close_old_connections()
