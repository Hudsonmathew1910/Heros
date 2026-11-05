"""
infinsight/views.py
--------------------
All API endpoints for Infinsight.
No AI logic here — delegates everything to the service layer.

Works for logged-in users AND guests (see infinsight/guest.py for the guest rules).
"""

import json
import logging
import time
import traceback
from concurrent.futures import ThreadPoolExecutor
from functools import wraps

from django.http import JsonResponse, StreamingHttpResponse
from django.shortcuts import render
from django.utils import timezone
from django_ratelimit.decorators import ratelimit
from django.views.decorators.csrf import csrf_exempt

from backend.models import User, Api
from backend.encryption import decrypt_api_key
from backend.utils import safe_error_response
from backend.usage_tracker import (
    INF_GUEST_UPLOAD_LIMIT, INF_GUEST_CHAT_LIMIT,
    get_guest_id, get_guest_ip, guest_remaining, guest_consume,
)
from .models import UploadedFile, ProjectSession, ChatMessage
from .Rag import ingest_file, query_session, cleanup_session, get_session_title
from . import guest as G

logger = logging.getLogger("infinsight.views")

# Thread pool for async ingestion (non-blocking uploads) + guest cleanup
_ingest_executor = ThreadPoolExecutor(max_workers=3)

# ─────────────────────────────────────────────────────────────────────────────
# Allowed file types and max size
# ─────────────────────────────────────────────────────────────────────────────
ALLOWED_EXTENSIONS = {"csv", "xlsx", "xls", "pdf"}
MAX_FILE_SIZE_MB = 20
MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024

EXT_TO_TYPE = {
    "csv": "csv",
    "xlsx": "excel",
    "xls": "excel",
    "pdf": "pdf",
}

# Key sources returned by _resolve_key
KEY_USER = "user"      # logged-in user's saved Gemini key
KEY_GUEST = "guest"    # key the visitor entered on Infinsight (session only, 24 h)
KEY_FREE = "free"      # server key — guest free tier (limited)


# ─────────────────────────────────────────────────────────────────────────────
# Identity
# ─────────────────────────────────────────────────────────────────────────────

def user_or_guest_json(f):
    """
    Sets request.user_obj (User or None) and request.guest_id.
    When a logged-in user still has guest sessions from this browser, they are
    moved into the account (expiry is kept).
    """
    @wraps(f)
    def wrapper(request, *args, **kwargs):
        request.user_obj = None
        uid = request.session.get("user_id")
        if uid:
            try:
                request.user_obj = User.objects.get(user_id=uid)
            except User.DoesNotExist:
                request.session.flush()
                return JsonResponse({"status": "fail", "message": "Session invalid"}, status=401)
        request.guest_id = get_guest_id(request)
        if request.user_obj:
            G.claim_guest_data(request.user_obj, request.guest_id)
        return f(request, *args, **kwargs)
    return wrapper


def _owned_sessions(request):
    """Sessions visible to this visitor (never expired ones)."""
    if request.user_obj:
        qs = ProjectSession.objects.filter(user=request.user_obj)
    else:
        qs = ProjectSession.objects.filter(user__isnull=True, anon_key=request.guest_id)
    return qs.filter(G.not_expired_q())


def _resolve_key(request):
    """Return (gemini_key, source) — source is KEY_USER / KEY_GUEST / KEY_FREE / None."""
    if request.user_obj:
        try:
            api = Api.objects.get(user=request.user_obj, model_name="Gemini")
            key = decrypt_api_key(api.api_key_encrypted)
            if key:
                return key, KEY_USER
        except Api.DoesNotExist:
            pass
    key = G.get_guest_key(request)
    if key:
        return key, KEY_GUEST
    if not request.user_obj:
        free = G.get_server_free_key()
        if free:
            return free, KEY_FREE
    return None, None


NO_KEY_MSG = "No Gemini API key found. Please add your Gemini key in profile / settings / api key."
FREE_UPLOAD_USED_MSG = (
    "You have used your free upload. Add your own Gemini API key (or log in and add it) "
    "to upload more files."
)
FREE_CHAT_USED_MSG = (
    f"You have used all {INF_GUEST_CHAT_LIMIT} free messages. Add your own Gemini API key "
    "(or log in and add it) to keep chatting."
)


def _validate_file(uploaded_file, max_mb=MAX_FILE_SIZE_MB):
    """Validate extension and file size. Returns (ext, file_type) or raises."""
    name = uploaded_file.name
    ext = name.rsplit(".", 1)[-1].lower() if "." in name else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise ValueError(f"Unsupported file type '.{ext}'. Allowed: CSV, Excel, PDF.")
    if uploaded_file.size > max_mb * 1024 * 1024:
        raise ValueError(f"File too large ({uploaded_file.size // (1024*1024)}MB). Max is {max_mb}MB.")
    return ext, EXT_TO_TYPE[ext]


def _ip_key(group, request):
    return get_guest_ip(request)


# ─────────────────────────────────────────────────────────────────────────────
# Main page
# ─────────────────────────────────────────────────────────────────────────────

def infinsight_page(request):
    """Render the Infinsight HTML page."""
    username = None
    user_id = request.session.get("user_id")
    if user_id:
        try:
            user = User.objects.get(user_id=user_id)
            username = user.name
        except Exception:
            pass
    return render(request, "infinsight.html", {"username": username})


# ─────────────────────────────────────────────────────────────────────────────
# Guest status + guest key
# ─────────────────────────────────────────────────────────────────────────────

@user_or_guest_json
def guest_status(request):
    """GET /infinsight/guest/status/ — what this visitor can do right now."""
    key, source = _resolve_key(request)
    is_guest = request.user_obj is None
    return JsonResponse({
        "status": "success",
        "logged_in": not is_guest,
        "key_source": source,                      # user / guest / free / null
        "has_own_key": source in (KEY_USER, KEY_GUEST),
        "free_uploads_left": guest_remaining(request, "inf_upload", INF_GUEST_UPLOAD_LIMIT) if is_guest else 0,
        "free_messages_left": guest_remaining(request, "inf_chat", INF_GUEST_CHAT_LIMIT) if is_guest else 0,
        "free_max_file_mb": G.GUEST_FREE_MAX_FILE_MB,
        "guest_ttl_hours": int(G.GUEST_TTL.total_seconds() // 3600),
    })


@csrf_exempt
@ratelimit(key=_ip_key, rate="10/h", block=False)
@user_or_guest_json
def guest_key(request):
    """
    POST   /infinsight/guest/key/  {"gemini": "..."} → validate + keep in session (24 h)
    DELETE /infinsight/guest/key/                     → forget it
    """
    if request.method == "DELETE":
        G.clear_guest_key(request)
        return JsonResponse({"status": "success", "message": "Key removed."})
    if request.method != "POST":
        return JsonResponse({"status": "fail", "message": "Method not allowed"}, status=405)
    if getattr(request, "limited", False):
        return JsonResponse({"status": "fail", "message": "Too many attempts. Try again later."}, status=429)
    try:
        key = (json.loads(request.body).get("gemini") or "").strip()
    except json.JSONDecodeError:
        return JsonResponse({"status": "fail", "message": "Invalid JSON"}, status=400)
    if not key:
        return JsonResponse({"status": "fail", "message": "Please enter your Gemini API key."}, status=400)
    if not G.validate_gemini_key(key):
        return JsonResponse({"status": "fail", "message": "This Gemini API key did not work. Please check it."}, status=400)
    G.set_guest_key(request, key)
    return JsonResponse({"status": "success", "message": "Key saved for this browser for 24 hours."})


# ─────────────────────────────────────────────────────────────────────────────
# File Upload + Session creation
# ─────────────────────────────────────────────────────────────────────────────
@csrf_exempt
@ratelimit(key=_ip_key, rate='5/m', block=True)
@user_or_guest_json
def upload_file(request):
    """
    POST /infinsight/upload/
    Accepts: multipart/form-data with 'file' field.
    Creates UploadedFile + ProjectSession, triggers async ingestion.
    """
    t0 = time.time()
    logger.info("Upload Request Received")
    if request.method != "POST":
        return JsonResponse({"status": "fail", "message": "Method not allowed"}, status=405)

    G.maybe_purge_in_background(_ingest_executor)

    uploaded = request.FILES.get("file")
    if not uploaded:
        return JsonResponse({"status": "fail", "message": "No file provided"}, status=400)

    is_guest = request.user_obj is None
    try:
        gemini_key, key_source = _resolve_key(request)
        if not gemini_key:
            raise ValueError(NO_KEY_MSG)

        if key_source == KEY_FREE:
            if guest_remaining(request, "inf_upload", INF_GUEST_UPLOAD_LIMIT) <= 0:
                return JsonResponse({"status": "fail", "code": "free_limit", "message": FREE_UPLOAD_USED_MSG}, status=402)
            ext, file_type = _validate_file(uploaded, max_mb=G.GUEST_FREE_MAX_FILE_MB)
        else:
            ext, file_type = _validate_file(uploaded)

        owner = {"user": request.user_obj} if not is_guest else {"user": None, "anon_key": request.guest_id}

        # Persist file record
        file_record = UploadedFile.objects.create(
            file=uploaded,
            original_filename=uploaded.name,
            file_type=file_type,
            file_size=uploaded.size,
            **owner,
        )

        # Generate a nice title
        title = get_session_title(uploaded.name, file_type, gemini_key)

        # Create session (status=processing). Guest sessions are temporary.
        session = ProjectSession.objects.create(
            uploaded_file=file_record,
            session_name=title,
            expires_at=(timezone.now() + G.GUEST_TTL) if is_guest else None,
            **owner,
        )

        if key_source == KEY_FREE:
            guest_consume(request, "inf_upload")

        # Kick off async ingestion
        _ingest_executor.submit(
            _async_ingest,
            session.session_id,
            file_record.file.path,
            file_type,
            gemini_key,
        )

        logger.debug("Upload logic completed in %.2fs", time.time() - t0)
        return JsonResponse({
            "status": "success",
            "message": "File uploaded. Processing started.",
            "session": _session_summary(session),
        })

    except ValueError as e:
        return JsonResponse({"status": "fail", "message": str(e)}, status=400)
    except Exception as e:
        return safe_error_response(request, logger, "Upload", e)


def _session_summary(s):
    return {
        "session_id": str(s.session_id),
        "session_name": s.session_name,
        "file_name": s.uploaded_file.original_filename,
        "file_type": s.uploaded_file.file_type,
        "status": s.status,
        "chunk_count": s.chunk_count,
        "created_at": s.created_at.isoformat(),
        "updated_at": s.updated_at.isoformat(),
        "expires_at": s.expires_at.isoformat() if s.expires_at else None,
    }


def _async_ingest(session_id, file_path: str, file_type: str, gemini_key: str):
    """Run inside thread pool — reads file from disk and ingests."""
    try:
        from django.db import close_old_connections
        close_old_connections()

        session = ProjectSession.objects.get(session_id=session_id)
        with open(file_path, "rb") as f:
            result = ingest_file(session, f, file_type, gemini_key)
        logger.info("Async ingestion done for %s: %s", session_id, result)
    except Exception as e:
        logger.error("Async ingest crashed for %s: %s\n%s", session_id, e, traceback.format_exc())
        try:
            from django.db import close_old_connections
            close_old_connections()
            session = ProjectSession.objects.get(session_id=session_id)
            session.status = "error"
            session.error_message = str(e)[:500]
            session.save(update_fields=["status", "error_message"])
        except Exception:
            pass


# ─────────────────────────────────────────────────────────────────────────────
# Chat
# ─────────────────────────────────────────────────────────────────────────────
@csrf_exempt
@ratelimit(key=_ip_key, rate='20/m', block=True)
@user_or_guest_json
def chat(request):
    """
    POST /infinsight/chat/
    Body: {"session_id": "...", "message": "..."}
    """
    t0 = time.time()
    logger.info("Chat Message Received")
    if request.method != "POST":
        return JsonResponse({"status": "fail", "message": "Method not allowed"}, status=405)

    try:
        data = json.loads(request.body)
    except json.JSONDecodeError:
        return JsonResponse({"status": "fail", "message": "Invalid JSON"}, status=400)

    session_id = data.get("session_id", "").strip()
    user_message = data.get("message", "").strip()

    if not session_id:
        return JsonResponse({"status": "fail", "message": "session_id required"}, status=400)
    if not user_message:
        return JsonResponse({"status": "fail", "message": "message required"}, status=400)

    try:
        session = _owned_sessions(request).get(session_id=session_id)
    except ProjectSession.DoesNotExist:
        return JsonResponse({"status": "fail", "message": "Session not found"}, status=404)

    gemini_key, key_source = _resolve_key(request)
    if not gemini_key:
        return JsonResponse({"status": "fail", "code": "no_key", "message": NO_KEY_MSG}, status=400)
    is_free = key_source == KEY_FREE
    if is_free and guest_remaining(request, "inf_chat", INF_GUEST_CHAT_LIMIT) <= 0:
        return JsonResponse({"status": "fail", "code": "free_limit", "message": FREE_CHAT_USED_MSG}, status=402)

    # Build chat history (last 6 messages)
    recent = list(session.messages.order_by("-timestamp")[:6])
    recent.reverse()
    history = []
    for msg in recent:
        history.append({"role": "user", "content": msg.user_message})
        history.append({"role": "assistant", "content": msg.ai_response})

    def event_stream():
        try:
            generator = query_session(session, user_message, gemini_key, history)
            for chunk in generator:
                if chunk["type"] == "final":
                    # Persist the exchange
                    if chunk.get("error") != "session_not_ready":
                        # If the LLM took over 10 minutes (API hangs), the DB SSL connection might have died silently.
                        # We force Django to close old/stale connections so it reconnects for the save.
                        from django.db import close_old_connections
                        close_old_connections()

                        ChatMessage.objects.create(
                            session=session,
                            user_message=user_message,
                            ai_response=chunk["reply"],
                            sources_used=chunk.get("sources", []),
                            model_used=chunk.get("model", "unknown"),
                        )
                        session.updated_at = timezone.now()
                        session.save(update_fields=["updated_at"])

                        # Free tier: only successful answers use up a message
                        if is_free and not chunk.get("error"):
                            guest_consume(request, "inf_chat")
                            chunk["free_messages_left"] = guest_remaining(request, "inf_chat", INF_GUEST_CHAT_LIMIT)

                    logger.debug("Total Response Time: %.2fs", time.time() - t0)

                yield f"data: {json.dumps(chunk)}\n\n"

        except Exception as e:
            logger.error("Chat view generator error: %s", traceback.format_exc())
            yield f"data: {json.dumps({'type': 'final', 'reply': 'An error occurred.', 'model': 'error', 'sources': []})}\n\n"

    return StreamingHttpResponse(event_stream(), content_type='text/event-stream')


# ─────────────────────────────────────────────────────────────────────────────
# Session Management
# ─────────────────────────────────────────────────────────────────────────────
@user_or_guest_json
def list_sessions(request):
    """GET /infinsight/sessions/ — list all sessions for this visitor."""
    G.maybe_purge_in_background(_ingest_executor)
    sessions = _owned_sessions(request).select_related("uploaded_file")
    data = []
    for s in sessions:
        item = _session_summary(s)
        item["message_count"] = s.messages.count()
        data.append(item)
    return JsonResponse({"status": "success", "sessions": data})


@user_or_guest_json
def session_detail(request, session_id):
    """
    GET  /infinsight/session/<id>/  → chat history
    DELETE /infinsight/session/<id>/delete/ → handled separately
    """
    try:
        session = _owned_sessions(request).get(session_id=session_id)
    except ProjectSession.DoesNotExist:
        return JsonResponse({"status": "fail", "message": "Session not found"}, status=404)

    messages = session.messages.order_by("timestamp")
    history = []
    for m in messages:
        history.append({
            "message_id": str(m.message_id),
            "user_message": m.user_message,
            "ai_response": m.ai_response,
            "model_used": m.model_used,
            "timestamp": m.timestamp.isoformat(),
        })

    info = _session_summary(session)
    info["metadata"] = session.uploaded_file.metadata
    return JsonResponse({"status": "success", "session": info, "messages": history})


@user_or_guest_json
def delete_session(request, session_id):
    """POST /infinsight/session/<id>/delete/"""
    if request.method not in ["DELETE", "POST"]:
        return JsonResponse({"status": "fail", "message": "Method not allowed"}, status=405)
    try:
        session = _owned_sessions(request).get(session_id=session_id)
        cleanup_session(session)  # Delete Pinecone vectors
        G._delete_file_record(session.uploaded_file)  # Deletes file from disk; cascades to session + messages
        return JsonResponse({"status": "success", "message": "Session deleted"})
    except ProjectSession.DoesNotExist:
        return JsonResponse({"status": "fail", "message": "Session not found"}, status=404)
    except Exception as e:
        return safe_error_response(request, logger, "Delete session", e)


@user_or_guest_json
def session_status(request, session_id):
    """GET /infinsight/session/<id>/status/ — poll processing status."""
    try:
        session = _owned_sessions(request).get(session_id=session_id)
        return JsonResponse({
            "status": "success",
            "session_status": session.status,
            "chunk_count": session.chunk_count,
            "error": session.error_message,
        })
    except ProjectSession.DoesNotExist:
        return JsonResponse({"status": "fail", "message": "Session not found"}, status=404)
