import json
import os
from unittest.mock import patch, MagicMock
from django.test import TestCase
from django.core.exceptions import ImproperlyConfigured
from backend.Nlp import get_intent
from backend.hero_model import Baymax

# Import Halo and client to ensure module is loaded and patches attach correctly
from backend.halo import Halo

class NlpTests(TestCase):
    def test_get_intent_direct(self):
        """Test rule-based intent parsing directly using Nlp's get_intent."""
        self.assertEqual(get_intent("play some music"), "play_song")
        self.assertEqual(get_intent("write python code to reverse a list"), "coding")
        self.assertEqual(get_intent("search for the latest news"), "web_search")
        self.assertEqual(get_intent("remind me to complete work at 5pm"), "task")
        self.assertEqual(get_intent("ok"), "chat")

from backend.hero_model import ProviderError, ModelError


class HeroModelTests(TestCase):
    @patch('backend.hero_model.requests.post')
    @patch('google.genai.Client')
    def test_baymax_fallback(self, mock_client_class, mock_requests):
        # Mock Gemini Client to raise an exception
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = Exception("Gemini quota exceeded")
        mock_client_class.return_value = mock_client
        
        # Mock OpenRouter to succeed
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "choices": [{"message": {"content": "Hello from OpenRouter!"}}]
        }
        mock_requests.return_value = mock_response
        
        baymax = Baymax(
            gemini_key="test-key",
            openrouter_key="test-key",
            chat_history=[]
        )
        
        response = baymax.handle_text("Hello")
        
        self.assertEqual(response, "Hello from OpenRouter!")
        self.assertTrue(mock_requests.called)

class HaloModelTests(TestCase):
    def test_halo_init_missing_token(self):
        """Test that Halo initialization raises ImproperlyConfigured when HF_TOKEN is missing."""
        # Temporarily hide HF_TOKEN from environment if set
        with patch.dict(os.environ, {}, clear=True):
            if "HF_TOKEN" in os.environ:
                del os.environ["HF_TOKEN"]
            with self.assertRaises(ImproperlyConfigured):
                Halo()

    @patch('backend.halo.InferenceClient')
    def test_halo_init_success(self, mock_client):
        """Test that Halo initializes successfully when HF_TOKEN is present."""
        with patch.dict(os.environ, {"HF_TOKEN": "hf_test_token"}):
            halo = Halo()
            self.assertTrue(len(halo.clients) > 0)
            self.assertTrue(mock_client.called)

    def test_parse_smart_output(self):
        """Test JSON smart parsing helper under various outputs."""
        with patch.dict(os.environ, {"HF_TOKEN": "hf_test_token"}):
            with patch('backend.halo.InferenceClient'):
                halo = Halo()
                
                # Test plain text
                self.assertEqual(halo.parse_smart_output("Hello there"), "Hello there")
                
                # Test raw valid JSON
                json_raw = '{"status": "play_extension", "url": "https://youtube.com/watch?v=123"}'
                parsed = halo.parse_smart_output(json_raw)
                self.assertIsInstance(parsed, dict)
                self.assertEqual(parsed["status"], "play_extension")
                
                # Test JSON wrapped in markdown code blocks
                json_md = '```json\n{"status": "yt_control", "command": "pause"}\n```'
                parsed_md = halo.parse_smart_output(json_md)
                self.assertIsInstance(parsed_md, dict)
                self.assertEqual(parsed_md["command"], "pause")
                
                # Test invalid JSON starting with '{'
                self.assertEqual(halo.parse_smart_output("{not valid json}"), "{not valid json}")

    @patch('backend.halo.InferenceClient')
    @patch('backend.halo.Halo._agentic_search_check', return_value=None)
    def test_halo_fallback_routing(self, mock_search_check, mock_client_class):
        """Test that Halo successfully falls back to its fallback model when the primary model fails."""
        mock_client = MagicMock()
        mock_client_class.return_value = mock_client
        
        # Primary call raises an exception, secondary fallback succeeds
        mock_client.chat_completion.side_effect = [
            Exception("Primary model service unavailable"),
            MagicMock(choices=[MagicMock(message=MagicMock(content="Hello from Llama 3.3 fallback!"))])
        ]
        
        with patch.dict(os.environ, {"HF_TOKEN": "hf_test_token"}, clear=True):
            halo = Halo()
            response = halo.handle_text("Hello")
            
            self.assertEqual(response, "Hello from Llama 3.3 fallback!")
            self.assertEqual(mock_client.chat_completion.call_count, 2)
            # Verify primary model was tried first, then the fallback model
            calls = mock_client.chat_completion.call_args_list
            self.assertEqual([c.kwargs["model"] for c in calls], [Halo.PRIMARY_MODEL, Halo.FALLBACK_MODEL])
            for c in calls:
                msgs = c.kwargs["messages"]
                self.assertEqual(msgs[0]["role"], "system")
                self.assertIn(Halo.TEXT_PROMPT, msgs[0]["content"])  # base prompt + runtime context
                self.assertEqual(msgs[-1], {"role": "user", "content": "Hello"})
                self.assertEqual(c.kwargs["max_tokens"], Halo.DEFAULT_MAX_TOKENS)
                self.assertEqual(c.kwargs["temperature"], Halo.DEFAULT_TEMPERATURE)


class HeroModelFastRoutingTests(TestCase):
    """
    Fast mode runs Gemini, OpenRouter and Groq in parallel. Inside each provider,
    a ModelError tries the next model; a ProviderError stops that provider.
    Gemini/OpenRouter are mocked to fail so only the Groq behaviour is under test
    (and no real network calls are made).
    """

    def _baymax(self):
        baymax = Baymax(gemini_key="gemini-key", openrouter_key="or-key", groq_key="groq-key", chat_history=[])
        baymax.is_fast = True
        return baymax

    @patch('backend.hero_model.Baymax._call_openrouter', side_effect=ProviderError("or down"))
    @patch('backend.hero_model.Baymax._call_gemini', side_effect=ProviderError("gemini down"))
    @patch('backend.hero_model.Baymax._call_groq')
    def test_fast_route_provider_error(self, mock_call_groq, mock_gemini, mock_or):
        """A ProviderError on the first Groq model stops Groq; with every provider down, fast mode reports failure."""
        from backend.fast import run_fast_route

        mock_call_groq.side_effect = ProviderError("Rate limit / traffic exceeded")

        response = run_fast_route(self._baymax(), "Hello", max_tokens=100, task="text_chat")

        self.assertEqual(response, "All fast models failed. Please try again later.")
        self.assertEqual(mock_call_groq.call_count, 1)  # remaining Groq models were not tried

    @patch('backend.hero_model.Baymax._call_openrouter', side_effect=ProviderError("or down"))
    @patch('backend.hero_model.Baymax._call_gemini', side_effect=ProviderError("gemini down"))
    @patch('backend.hero_model.Baymax._call_groq')
    def test_fast_route_model_error(self, mock_call_groq, mock_gemini, mock_or):
        """A ModelError on the first Groq model moves on to the next Groq model."""
        from backend.fast import run_fast_route

        mock_call_groq.side_effect = [
            ModelError("Model not found"),
            "Hello from second Groq model!",
        ]

        response = run_fast_route(self._baymax(), "Hello", max_tokens=100, task="text_chat")

        self.assertEqual(response, "Hello from second Groq model!")
        self.assertEqual(mock_call_groq.call_count, 2)  # first failed, second succeeded


class HaloUsageLimitTests(TestCase):
    def setUp(self):
        pass

    def tearDown(self):
        pass

    def test_increment_and_check_usage(self):
        from backend.usage_tracker import get_halo_usage, increment_halo_usage
        user_key = "test_user_key"
        self.assertEqual(get_halo_usage(user_key), 0)
        
        increment_halo_usage(user_key)
        self.assertEqual(get_halo_usage(user_key), 1)
        
        increment_halo_usage(user_key)
        self.assertEqual(get_halo_usage(user_key), 2)

    def test_chat_api_halo_blocked_for_guests(self):
        from django.test import Client

        response = Client().post(
            '/api/chat',
            data=json.dumps({'message': 'Hello Halo', 'model': 'Halo', 'mode': 'text'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("login_required"))
        self.assertIn("Halo is only available after you log in", data.get("reply", ""))

    def test_chat_api_halo_blocked_features(self):
        from django.test import Client
        client = Client()
        
        # Request coding mode which should be blocked immediately
        response = client.post(
            '/api/chat',
            data=json.dumps({
                'message': 'Write python code to compute fibonacci',
                'model': 'Halo',
                'mode': 'coding',
                'session_id': 'test_session_coding',
            }),
            content_type='application/json',
            HTTP_X_SESSION_ID='test_session_coding'
        )
        
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("login_required"))
        self.assertIn("Login Required", data.get("reply", ""))

    def test_baymax_limit_enforced(self):
        from django.test import Client
        from django.utils import timezone
        from backend.usage_tracker import GUEST_CHAT_LIMIT, increment_halo_usage

        # Fill this IP's daily guest allowance (Django test client IP = 127.0.0.1)
        ip_key = f"baymax_ip_127.0.0.1_{timezone.now().strftime('%Y%m%d')}"
        for _ in range(GUEST_CHAT_LIMIT):
            increment_halo_usage(ip_key)

        response = Client().post(
            '/api/chat',
            data=json.dumps({'message': 'Hello Baymax', 'model': 'Baymax', 'mode': 'text'}),
            content_type='application/json',
        )

        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertTrue(data.get("limit_reached"))
        self.assertIn("Free limit reached", data.get("reply", ""))


from django.test import TestCase, TransactionTestCase


class UsageTrackingIsolationTests(TransactionTestCase):
    @patch('backend.hero_model.Baymax.handle_text')
    def test_web_ui_chat_api_bypasses_usage_tracking_and_rate_limits(self, mock_handle_text):
        mock_handle_text.return_value = "Hello from Baymax UI"
        from django.test import Client
        from backend.models import User, ApiUsageTracking, UserDailyQuota
        
        user = User.objects.create(email="testui@example.com", name="Test UI User")
        client = Client()
        
        # Simulate session login
        session = client.session
        session['user_id'] = str(user.user_id)
        session.save()

        initial_log_count = ApiUsageTracking.objects.filter(user=user).count()

        import uuid
        test_session_id = str(uuid.uuid4())

        # Call web chat endpoint (/api/chat)
        response = client.post(
            '/api/chat',
            data=json.dumps({
                'message': 'Hello from playground',
                'model': 'Baymax',
                'mode': 'text',
                'session_id': test_session_id,
                'temporary_chat': True,
            }),
            content_type='application/json'
        )

        self.assertEqual(response.status_code, 200)
        
        # Ensure NO ApiUsageTracking record was created for web chat
        final_log_count = ApiUsageTracking.objects.filter(user=user).count()
        self.assertEqual(final_log_count, initial_log_count)

        # Ensure NO UserDailyQuota record was created or incremented
        quota_exists = UserDailyQuota.objects.filter(user=user).exists()
        self.assertFalse(quota_exists)

    @patch('backend.hero_model.Baymax.handle_developer_api')
    def test_developer_api_tracks_usage_and_rate_limits(self, mock_handle_dev):
        mock_handle_dev.return_value = "Hello from Developer API"
        from django.test import Client
        from backend.models import User, DeveloperApiKey, ApiUsageTracking, UserDailyQuota
        import hashlib

        user = User.objects.create(email="testdev@example.com", name="Test Dev User")
        raw_key = "heros_test_api_key_12345"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        DeveloperApiKey.objects.create(user=user, key=key_hash, name="Test Key", is_active=True)

        client = Client()

        # Call developer completions endpoint (/api/v1/chat/completions)
        response = client.post(
            '/api/v1/chat/completions',
            data=json.dumps({
                'model': 'baymax-4.5',
                'messages': [{'role': 'user', 'content': 'Hello dev API'}],
            }),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {raw_key}"
        )

        self.assertEqual(response.status_code, 200)

        # Ensure ApiUsageTracking WAS logged for developer API key request
        log_entry = ApiUsageTracking.objects.filter(user=user, request_source='developer_api').first()
        self.assertIsNotNone(log_entry)
        self.assertEqual(log_entry.endpoint, "/api/v1/chat/completions")

        # Ensure UserDailyQuota WAS updated for developer API key request
        quota = UserDailyQuota.objects.filter(user=user).first()
        self.assertIsNotNone(quota)
        self.assertGreaterEqual(quota.requests_count, 1)

    def test_read_only_key_scope_enforcement(self):
        from django.test import Client
        from backend.models import User, DeveloperApiKey, ApiUsageTracking
        import hashlib

        user = User.objects.create(email="readonly@example.com", name="Readonly User")
        raw_key = "heros_test_readonly_key_99999"
        key_hash = hashlib.sha256(raw_key.encode()).hexdigest()
        DeveloperApiKey.objects.create(user=user, key=key_hash, name="Readonly Key", scope="read", is_active=True)

        client = Client()

        # 1. Read-only key MUST be denied on chat completions (403 Forbidden)
        response_comp = client.post(
            '/api/v1/chat/completions',
            data=json.dumps({
                'model': 'baymax-4.5',
                'messages': [{'role': 'user', 'content': 'Hello'}],
            }),
            content_type='application/json',
            HTTP_AUTHORIZATION=f"Bearer {raw_key}"
        )
        self.assertEqual(response_comp.status_code, 403)
        self.assertIn("read-only permissions", response_comp.json().get("error", {}).get("message", ""))

        # 2. Read-only key CAN access usage telemetry (200 OK)
        response_usage = client.get(
            '/api/v1/usage',
            HTTP_AUTHORIZATION=f"Bearer {raw_key}"
        )
        self.assertEqual(response_usage.status_code, 200)
        data = response_usage.json()
        self.assertEqual(data.get("status"), "success")
        self.assertEqual(data.get("key", {}).get("scope"), "read")
        self.assertIn("quota", data)
        self.assertIn("today_usage", data)


