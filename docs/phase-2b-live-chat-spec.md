# Phase 2B: Live Chat System Specification

**Version:** 1.1
**Date:** February 2026
**Status:** Planning (Reviewed)

---

## 1. Overview

A multi-tab chat widget providing self-service help, live agent chat, news/announcements, and product roadmap visibility. Deployed as:

1. **Lead Bot** — Widget on marketing site (acrux.education) for prospects
2. **User Bot** — Widget inside Pnyx for authenticated teachers/admins

### Goals

- Reduce support ticket volume through self-service (KB search first)
- Provide real-time chat with support agents when needed
- Capture leads from prospects on marketing site
- Keep users informed with news and roadmap updates
- Unified agent inbox in Praxis for all conversations

### Widget Tabs (Intercom-style)

| Tab | Icon | Purpose | Content Source |
|-----|------|---------|----------------|
| **Home** | House | Default landing, quick help | KB search, featured articles, announcements |
| **Messages** | Chat bubble | Live conversations | ChatSession/ChatMessage |
| **News** | Megaphone | Product updates, announcements | Announcement model |
| **Roadmap** | Map | Product roadmap visibility | RoadmapItem model |
| **Help** | Question mark | Browse knowledge base | KB Topics/Articles |

---

## 2. Data Model

### ChatSession

```python
class ChatSession(models.Model):
    """
    A chat conversation between visitor/user and agent(s).
    """
    # Identity
    session_key = models.CharField(max_length=64, unique=True, db_index=True)

    # Visitor context (for anonymous/lead bot)
    visitor_name = models.CharField(max_length=100, blank=True)
    visitor_email = models.EmailField(blank=True)
    visitor_metadata = models.JSONField(default=dict, blank=True)
    # e.g., {"page_url": "...", "referrer": "...", "utm_source": "..."}

    # Authenticated user context (for user bot in Pnyx)
    user = models.ForeignKey(
        'users.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='chat_sessions'
    )

    # School context (if known)
    school = models.ForeignKey(
        'organisation.School',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='chat_sessions'
    )

    # Contact (created/linked when lead captured or user identified)
    contact = models.ForeignKey(
        'contact.Contact',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='chat_sessions'
    )

    # Source
    source = models.CharField(max_length=20, choices=[
        ('lead_bot', 'Lead Bot (Marketing Site)'),
        ('user_bot', 'User Bot (Pnyx)'),
        ('agent_initiated', 'Agent Initiated'),
    ])

    # Status
    status = models.CharField(max_length=20, choices=[
        ('active', 'Active'),
        ('waiting', 'Waiting for Agent'),
        ('assigned', 'Assigned to Agent'),
        ('resolved', 'Resolved'),
        ('abandoned', 'Abandoned'),
    ], default='active')

    # Assignment
    assigned_agent = models.ForeignKey(
        'users.User',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='assigned_chats'
    )

    # Timing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    first_agent_response_at = models.DateTimeField(null=True, blank=True)
    resolved_at = models.DateTimeField(null=True, blank=True)

    # Activity tracking (for inbox sorting and abandon detection)
    last_visitor_message_at = models.DateTimeField(null=True, blank=True)
    last_agent_message_at = models.DateTimeField(null=True, blank=True)
    last_heartbeat_at = models.DateTimeField(null=True, blank=True)

    # Outcome
    converted_to_ticket = models.ForeignKey(
        'helpdesk.Ticket',
        null=True, blank=True,
        on_delete=models.SET_NULL,
        related_name='source_chat'
    )
    converted_to_lead = models.BooleanField(default=False)

    # Analytics
    message_count = models.IntegerField(default=0)
    visitor_message_count = models.IntegerField(default=0)
    agent_message_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['-updated_at']
        indexes = [
            models.Index(fields=['status', 'updated_at']),
            models.Index(fields=['assigned_agent', 'status']),
            models.Index(fields=['source', 'created_at']),
            models.Index(fields=['status', 'last_visitor_message_at']),  # For "waiting longest"
        ]

    @classmethod
    def claim_chat(cls, session_id: int, agent) -> bool:
        """
        Atomically claim a chat. Returns True if successful, False if already claimed.
        Prevents race conditions when multiple agents try to claim simultaneously.
        """
        updated = cls.objects.filter(
            id=session_id,
            assigned_agent__isnull=True,
            status='waiting'
        ).update(
            assigned_agent=agent,
            status='assigned'
        )
        return updated > 0  # True if we claimed it, False if someone else did
```

### ChatMessage

```python
class ChatMessage(models.Model):
    """
    Individual message within a chat session.
    """
    session = models.ForeignKey(
        ChatSession,
        on_delete=models.CASCADE,
        related_name='messages'
    )

    # Sender
    sender_type = models.CharField(max_length=20, choices=[
        ('visitor', 'Visitor'),
        ('user', 'Authenticated User'),
        ('agent', 'Support Agent'),
        ('bot', 'Automated Bot'),
        ('system', 'System Message'),
    ])
    sender_user = models.ForeignKey(
        'users.User',
        null=True, blank=True,
        on_delete=models.SET_NULL
    )
    sender_name = models.CharField(max_length=100, blank=True)

    # Content
    content = models.TextField()
    content_type = models.CharField(max_length=20, choices=[
        ('text', 'Text'),
        ('markdown', 'Markdown'),  # Server-rendered safely
        ('card', 'Card/Rich Content'),
    ], default='text')
    # NOTE: HTML type removed to prevent XSS risks

    # Rich content (for bot responses with KB articles, buttons, etc.)
    rich_content = models.JSONField(null=True, blank=True)
    # e.g., {"type": "article_card", "article_id": 123, "title": "...", "url": "..."}
    # e.g., {"type": "buttons", "buttons": [{"label": "Yes", "action": "..."}]}

    # Attachments (User Bot only - not allowed for Lead Bot)
    attachments = models.JSONField(default=list, blank=True)
    # e.g., [{"name": "screenshot.png", "url": "...", "type": "image/png"}]

    # Status
    is_internal = models.BooleanField(default=False)  # Internal note, not shown to visitor
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    is_deleted = models.BooleanField(default=False)  # Soft delete for agent corrections/GDPR
    deleted_at = models.DateTimeField(null=True, blank=True)

    # Metadata (for AI tags, sentiment, flags, embeddings)
    metadata = models.JSONField(default=dict, blank=True)
    # e.g., {"sentiment": "positive", "intent": "demo_request", "ai_confidence": 0.92}

    # Timing
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
        indexes = [
            models.Index(fields=['session', 'created_at']),
            models.Index(fields=['session', 'is_deleted']),
        ]
```

### AgentPresence

```python
class AgentPresence(models.Model):
    """
    Tracks agent availability for chat assignment.
    """
    user = models.OneToOneField(
        'users.User',
        on_delete=models.CASCADE,
        related_name='chat_presence'
    )

    status = models.CharField(max_length=20, choices=[
        ('online', 'Online'),
        ('away', 'Away'),
        ('busy', 'Busy'),
        ('offline', 'Offline'),
    ], default='offline')

    # Capacity
    max_concurrent_chats = models.IntegerField(default=5)
    current_chat_count = models.IntegerField(default=0)

    # Timing
    last_seen_at = models.DateTimeField(auto_now=True)
    went_online_at = models.DateTimeField(null=True, blank=True)

    @property
    def is_available(self):
        return (
            self.status == 'online' and
            self.current_chat_count < self.max_concurrent_chats
        )

    class Meta:
        verbose_name_plural = "Agent presences"
```

### Announcement (for News tab)

```python
class Announcement(models.Model):
    """
    Product announcements shown in chat widget News tab.
    """
    title = models.CharField(max_length=200)
    summary = models.TextField(help_text="Short description for list view")
    content = models.TextField(help_text="Full content in Markdown")

    # Media
    image_url = models.URLField(blank=True)
    video_url = models.URLField(blank=True)

    # Categorisation
    category = models.CharField(max_length=30, choices=[
        ('feature', 'New Feature'),
        ('improvement', 'Improvement'),
        ('update', 'Update'),
        ('maintenance', 'Maintenance'),
        ('event', 'Event'),
    ], default='update')

    # Targeting
    audience = models.CharField(max_length=20, choices=[
        ('all', 'All Users'),
        ('prospects', 'Prospects Only'),
        ('users', 'Authenticated Users Only'),
        ('teachers', 'Teachers'),
        ('admins', 'School Admins'),
    ], default='all')

    # Publishing
    is_published = models.BooleanField(default=False)
    published_at = models.DateTimeField(null=True, blank=True)
    expires_at = models.DateTimeField(null=True, blank=True)
    is_pinned = models.BooleanField(default=False)

    # Tracking
    view_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-is_pinned', '-published_at']
```

### RoadmapItem (for Roadmap tab)

```python
class RoadmapItem(models.Model):
    """
    Public roadmap items shown in chat widget.
    """
    title = models.CharField(max_length=200)
    description = models.TextField()

    status = models.CharField(max_length=20, choices=[
        ('planned', 'Planned'),
        ('in_progress', 'In Progress'),
        ('beta', 'Beta'),
        ('released', 'Released'),
    ], default='planned')

    # Timing
    quarter = models.CharField(max_length=10, blank=True)  # e.g., "Q1 2026"
    target_date = models.DateField(null=True, blank=True)
    released_at = models.DateField(null=True, blank=True)

    # Categorisation
    category = models.CharField(max_length=30, choices=[
        ('assessment', 'Assessments'),
        ('marking', 'Marking'),
        ('reports', 'Reports'),
        ('integrations', 'Integrations'),
        ('platform', 'Platform'),
    ])

    # Visibility
    is_public = models.BooleanField(default=True)
    order = models.IntegerField(default=0)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['order', '-target_date']
```

### OperatingHours

```python
class OperatingHours(models.Model):
    """
    Operating hours for chat availability.
    Supports per-region configuration for global teams.
    """
    region = models.CharField(
        max_length=10,
        default='default',
        help_text="Region code: 'default', 'au', 'uk', etc."
    )
    day_of_week = models.IntegerField(
        choices=[
            (0, 'Monday'),
            (1, 'Tuesday'),
            (2, 'Wednesday'),
            (3, 'Thursday'),
            (4, 'Friday'),
            (5, 'Saturday'),
            (6, 'Sunday'),
        ]
    )
    open_time = models.TimeField()
    close_time = models.TimeField()
    timezone = models.CharField(max_length=50)  # e.g., 'Australia/Sydney'
    is_active = models.BooleanField(default=True)

    class Meta:
        unique_together = ['region', 'day_of_week']
        ordering = ['region', 'day_of_week']

    @classmethod
    def is_online(cls, region: str = 'default') -> bool:
        """Check if chat is currently within operating hours."""
        from django.utils import timezone as tz
        import pytz

        now = tz.now()
        hours = cls.objects.filter(
            region=region,
            day_of_week=now.weekday(),
            is_active=True
        ).first()

        if not hours:
            # Fall back to default region
            hours = cls.objects.filter(
                region='default',
                day_of_week=now.weekday(),
                is_active=True
            ).first()

        if not hours:
            return False  # No hours configured = offline

        local_tz = pytz.timezone(hours.timezone)
        local_now = now.astimezone(local_tz).time()
        return hours.open_time <= local_now <= hours.close_time
```

### ChatSettings (Singleton)

```python
class ChatSettings(models.Model):
    """
    Global chat configuration settings.
    Singleton model - only one row should exist.
    """
    # Auto-reply
    offline_message = models.TextField(
        default="Our team is currently offline. Leave a message and we'll get back to you.",
        help_text="Shown when outside operating hours"
    )
    offline_response_time = models.CharField(
        max_length=100,
        default="within 24 hours",
        help_text="Expected response time shown in offline message"
    )

    # Notifications (org-wide defaults)
    default_sound_enabled = models.BooleanField(default=True)
    default_browser_notifications = models.BooleanField(default=True)

    # Retention
    archive_after_days = models.IntegerField(default=90)
    delete_after_days = models.IntegerField(default=730)  # 2 years

    # File uploads (User Bot only)
    max_file_size_mb = models.IntegerField(default=5)
    allowed_file_types = models.JSONField(
        default=list,
        blank=True,
        help_text="e.g., ['image/png', 'image/jpeg', 'application/pdf']"
    )

    # Rate limiting
    max_messages_per_second = models.IntegerField(default=3)
    max_messages_per_minute = models.IntegerField(default=20)

    # Abandon detection
    heartbeat_interval_seconds = models.IntegerField(default=30)
    abandon_timeout_seconds = models.IntegerField(default=120)

    # SLA
    sla_first_response_seconds = models.IntegerField(default=60)

    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = "Chat Settings"
        verbose_name_plural = "Chat Settings"

    def clean(self):
        """Enforce singleton - prevent creating additional instances."""
        from django.core.exceptions import ValidationError
        if not self.pk and ChatSettings.objects.exists():
            raise ValidationError("Only one ChatSettings instance is allowed.")

    def save(self, *args, **kwargs):
        self.pk = 1  # Enforce singleton
        self.full_clean()  # Run validation
        super().save(*args, **kwargs)

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj
```

---

## 3. WebSocket Implementation (Django Channels)

### Channel Layer Configuration

```python
# config/settings/base.py
CHANNEL_LAYERS = {
    "default": {
        "BACKEND": "channels_redis.core.RedisChannelLayer",
        "CONFIG": {
            "hosts": [os.environ.get("REDIS_URL", "redis://localhost:6379")],
        },
    },
}

ASGI_APPLICATION = "config.asgi.application"
```

### WebSocket Routing

```python
# praxis/chat/routing.py
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    # Visitor/user chat connection (accepts UUIDs with hyphens)
    re_path(r'ws/chat/(?P<session_key>[A-Za-z0-9-]+)/$', consumers.ChatConsumer.as_asgi()),
    # Agent inbox connection
    re_path(r'ws/agent/inbox/$', consumers.AgentInboxConsumer.as_asgi()),
]
```

### Chat Consumer

```python
# praxis/chat/consumers.py
import json
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from channels.db import database_sync_to_async

class ChatConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for visitor/user chat sessions.
    """

    async def connect(self):
        self.session_key = self.scope['url_route']['kwargs']['session_key']
        self.room_group_name = f'chat_{self.session_key}'

        # Join room group
        await self.channel_layer.group_add(
            self.room_group_name,
            self.channel_name
        )
        await self.accept()

        # Send chat history
        history = await self.get_chat_history()
        await self.send_json({
            'type': 'history',
            'messages': history
        })

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(
            self.room_group_name,
            self.channel_name
        )

    async def receive_json(self, content):
        message_type = content.get('type')

        if message_type == 'message':
            await self.handle_message(content)
        elif message_type == 'typing':
            await self.handle_typing(content)
        elif message_type == 'read':
            await self.handle_read(content)
        elif message_type == 'request_agent':
            await self.handle_request_agent(content)
        elif message_type == 'heartbeat':
            await self.handle_heartbeat()

    async def handle_message(self, content):
        # Client sends temp_id for message acking
        temp_id = content.get('temp_id')

        # Save message to database
        message = await self.save_message(content['text'])

        # Send ack with real_id back to sender (for message ordering/dedup)
        await self.send_json({
            'type': 'message_ack',
            'temp_id': temp_id,
            'real_id': message['id'],
        })

        # Check for auto-responses (KB search, bot)
        bot_response = await self.check_bot_response(content['text'])

        # Broadcast to room (visitor + any assigned agent)
        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'message': message,
            }
        )

        if bot_response:
            await self.channel_layer.group_send(
                self.room_group_name,
                {
                    'type': 'chat_message',
                    'message': bot_response,
                }
            )

        # Notify agent inbox if waiting
        await self.notify_agent_inbox()

    async def handle_heartbeat(self):
        """Update session heartbeat for abandon detection."""
        await self.update_heartbeat()
        await self.send_json({'type': 'heartbeat_ack'})

    async def chat_message(self, event):
        await self.send_json({
            'type': 'message',
            'message': event['message']
        })

    async def agent_joined(self, event):
        await self.send_json({
            'type': 'agent_joined',
            'agent': event['agent']
        })

    @database_sync_to_async
    def save_message(self, text):
        # Implementation
        pass

    @database_sync_to_async
    def check_bot_response(self, text):
        # Search KB, generate bot response
        pass


class AgentInboxConsumer(AsyncJsonWebsocketConsumer):
    """
    WebSocket consumer for agent inbox.
    Receives notifications for new chats, assignments, messages.
    """

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close()
            return

        # Join agent-specific group
        self.agent_group = f'agent_{user.id}'
        await self.channel_layer.group_add(self.agent_group, self.channel_name)

        # Join global agent notification group
        await self.channel_layer.group_add('agents', self.channel_name)

        await self.accept()

        # Send initial inbox state
        inbox = await self.get_inbox_state()
        await self.send_json({'type': 'inbox_state', 'data': inbox})

    async def receive_json(self, content):
        action = content.get('action')

        if action == 'claim_chat':
            await self.handle_claim_chat(content['session_id'])
        elif action == 'send_message':
            await self.handle_send_message(content)
        elif action == 'typing':
            await self.handle_agent_typing(content)
        elif action == 'update_status':
            await self.handle_update_status(content['status'])
        elif action == 'resolve_chat':
            await self.handle_resolve_chat(content['session_id'])
        elif action == 'convert_to_ticket':
            await self.handle_convert_to_ticket(content)

    async def handle_agent_typing(self, content):
        """Broadcast agent typing indicator to visitor."""
        session_key = content['session_key']
        is_typing = content.get('is_typing', True)
        await self.channel_layer.group_send(
            f'chat_{session_key}',
            {
                'type': 'agent_typing',
                'is_typing': is_typing,
                'agent_name': self.scope['user'].get_full_name(),
            }
        )

    async def handle_claim_chat(self, session_id):
        """Atomically claim a chat - prevents race conditions."""
        from praxis.chat.models import ChatSession
        success = await database_sync_to_async(ChatSession.claim_chat)(
            session_id, self.scope['user']
        )
        if success:
            await self.send_json({'type': 'claim_success', 'session_id': session_id})
            # Join the chat room to receive messages
            session = await self.get_session(session_id)
            await self.channel_layer.group_add(f'chat_{session.session_key}', self.channel_name)
        else:
            await self.send_json({'type': 'claim_failed', 'reason': 'already_claimed'})

    async def new_chat_notification(self, event):
        await self.send_json({
            'type': 'new_chat',
            'session': event['session']
        })

    async def chat_assigned(self, event):
        await self.send_json({
            'type': 'chat_assigned',
            'session': event['session']
        })

    async def new_message(self, event):
        await self.send_json({
            'type': 'new_message',
            'session_id': event['session_id'],
            'message': event['message']
        })
```

---

## 4. API Endpoints

### Public Endpoints (No Auth — Widget)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/sessions/` | POST | Create new chat session |
| `/api/chat/sessions/{key}/` | GET | Get session with messages |
| `/api/chat/sessions/{key}/messages/` | POST | Send message (REST fallback) |
| `/api/chat/sessions/{key}/visitor/` | PATCH | Update visitor info (name, email) |
| `/api/chat/announcements/` | GET | List published announcements |
| `/api/chat/roadmap/` | GET | List public roadmap items |

### Authenticated Endpoints (Agent Inbox — Praxis)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/sessions/{id}/transcript/` | GET | Export transcript (format=text\|html) |
|----------|--------|-------------|
| `/api/chat/inbox/` | GET | Agent inbox - active/waiting chats |
| `/api/chat/inbox/stats/` | GET | Inbox statistics |
| `/api/chat/sessions/{id}/claim/` | POST | Claim a chat |
| `/api/chat/sessions/{id}/resolve/` | POST | Resolve chat |
| `/api/chat/sessions/{id}/convert-to-ticket/` | POST | Create helpdesk ticket |
| `/api/chat/sessions/{id}/messages/` | GET/POST | Get/send messages |
| `/api/chat/presence/` | GET/PATCH | Get/update agent presence |

### Admin Endpoints (Praxis Admin)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/chat/admin/announcements/` | CRUD | Manage announcements |
| `/api/chat/admin/roadmap/` | CRUD | Manage roadmap items |
| `/api/chat/admin/sessions/` | GET | All sessions with filters |
| `/api/chat/analytics/` | GET | Chat analytics |

---

## 5. Bot Logic (Auto-Responses)

### Flow

```
Visitor sends message
        │
        ▼
┌─────────────────┐
│ Intent Detection│
│ (keyword match) │
└────────┬────────┘
         │
    ┌────┴────┐
    │ Type?   │
    └────┬────┘
         │
    ┌────┼────────────┬─────────────┐
    │    │            │             │
    ▼    ▼            ▼             ▼
┌──────┐ ┌──────┐  ┌──────┐    ┌──────┐
│ Help │ │ Demo │  │ Price│    │ Other│
│Query │ │Request│ │Query │    │      │
└──┬───┘ └──┬───┘  └──┬───┘    └──┬───┘
   │        │         │           │
   ▼        ▼         ▼           ▼
Search   Collect    Show       Route to
  KB     details   pricing      agent
   │        │      info         queue
   ▼        │         │           │
Show        └─────────┴───────────┘
articles              │
   │                  ▼
   ▼           Create/Update
"Did this        lead record
 help?"
```

### Intent Keywords

| Intent | Keywords | Action |
|--------|----------|--------|
| Help/Support | "help", "how do I", "can't", "problem", "issue" | Search KB → show articles |
| Demo Request | "demo", "see it", "show me", "try" | Collect name/email → book demo |
| Pricing | "price", "cost", "how much", "pricing" | Show pricing info → offer demo |
| Human | "speak to someone", "real person", "agent" | Route to agent queue |

### KB Integration

When user asks a question:

1. Search KB using `/api/kb/chatbot/search/`
2. If results found with relevance > 0.7:
   - Show top 3 article cards
   - Ask "Did this help?"
   - If "No" → route to agent
3. If no results:
   - "I couldn't find an answer. Would you like to chat with our team?"
   - Route to agent queue

### Confidence Decay (Auto-Escalation)

If visitor sends 2+ follow-up messages after KB suggestions without clicking an article or saying "yes", auto-escalate to human agent. This prevents bot loops.

```python
# Track in session metadata
if session.bot_suggestions_shown >= 2 and session.last_suggestion_clicked is None:
    escalate_to_agent(session)
```

### Page-Scoped Prompts (Lead Bot Only)

Bot adjusts initial suggestions based on the page the visitor is on (from `visitor_metadata.page_url`):

| Page Contains | Bot Behaviour |
|---------------|---------------|
| `/pricing` | Surface pricing-related KB articles first |
| `/demo` | Offer to book a demo immediately |
| `/login`, `/auth` | Surface login troubleshooting articles |
| `/contact` | Prioritise "speak to someone" option |

**Note:** Does NOT auto-open the widget - just adjusts content when visitor opens it.

---

## 6. Lead Capture Flow (Marketing Site)

### Anonymous Visitor Tracking

```javascript
// Widget initialisation captures:
{
  session_key: generateUUID(),
  visitor_metadata: {
    page_url: window.location.href,
    referrer: document.referrer,
    utm_source: getUrlParam('utm_source'),
    utm_medium: getUrlParam('utm_medium'),
    utm_campaign: getUrlParam('utm_campaign'),
  }
}
```

### Lead Qualification

When visitor:
1. **Provides email** → Create Contact in Praxis
2. **Requests demo** → Create Contact + trigger demo booking flow
3. **Mentions school name** → Try to match to School record

### Conversion Triggers

| Action | Creates |
|--------|---------|
| Email provided | Contact (status: lead) |
| Demo requested | Contact + Activity (demo_requested) |
| School mentioned | Link Contact to School |
| Chat completed | Activity on Contact |

---

## 7. Agent Inbox (Praxis)

### Inbox Views

1. **Waiting** — Unassigned chats needing attention
2. **My Chats** — Currently assigned to this agent
3. **All Chats** — All active chats (admin view)
4. **Resolved** — Recently resolved (last 24h)

### Real-Time Updates

Via WebSocket:
- New chat notification (sound + badge)
- New message in assigned chat
- Chat claimed by another agent
- Visitor typing indicator
- Agent typing indicator (two-way)
- Visitor went offline / abandoned

### Agent Inbox UX Requirements

| Feature | Description |
|---------|-------------|
| **SLA Breach Highlighting** | Row turns red if waiting > 60s without agent reply |
| **Unread Count Per Chat** | Badge showing unread message count for each conversation |
| **Internal Notes Tab** | Right panel shows internal notes (not visible to visitor) |
| **Waiting Longest Sort** | Waiting queue sorted by `last_visitor_message_at` ascending |
| **Visitor Online Status** | Green dot if heartbeat < 30s, yellow if < 120s, grey if abandoned |

### Quick Actions

- **Claim** — Take ownership of waiting chat
- **Transfer** — Hand off to another agent
- **Resolve** — Mark as resolved
- **Convert to Ticket** — Create helpdesk ticket with transcript
- **View Contact** — Open contact in CRM (if linked)
- **View School** — Open school record (if linked)

### Canned Responses

Agents can save and use template responses:
- Greeting templates
- Common answers
- Handoff messages
- Closing messages

---

## 8. Implementation Plan

### Phase 2B-1: Core Infrastructure
1. Add Django Channels + channels-redis to requirements
2. Configure ASGI application
3. Create `praxis/chat/` app with models
4. Implement WebSocket consumers
5. Deploy Redis on Railway

### Phase 2B-2: Chat Session API
1. Implement REST endpoints for session management
2. Implement message sending (REST + WebSocket)
3. Bot auto-response logic
4. KB search integration

### Phase 2B-3: Agent Inbox API
1. Agent presence management
2. Inbox endpoints (list, claim, resolve)
3. Agent WebSocket consumer
4. Convert to ticket functionality

### Phase 2B-4: News & Roadmap
1. Announcement model + CRUD API
2. RoadmapItem model + CRUD API
3. Public list endpoints

### Phase 2B-5: Analytics
1. Chat session metrics
2. Response time tracking
3. Resolution tracking
4. Lead conversion tracking

---

## 9. Frontend Integration Guide (Praxis Team)

### Widget Component Structure

```
ChatWidget/
├── ChatWidget.tsx           # Main container
├── ChatLauncher.tsx         # Floating button to open widget
├── tabs/
│   ├── HomeTab.tsx          # Default view with search + articles
│   ├── MessagesTab.tsx      # Chat conversation view
│   ├── NewsTab.tsx          # Announcements list
│   ├── RoadmapTab.tsx       # Roadmap items
│   └── HelpTab.tsx          # KB topic browser
├── components/
│   ├── MessageList.tsx      # Chat message list
│   ├── MessageInput.tsx     # Text input + send button
│   ├── ArticleCard.tsx      # KB article preview card
│   ├── AnnouncementCard.tsx # News item card
│   ├── RoadmapCard.tsx      # Roadmap item card
│   ├── TypingIndicator.tsx  # "Agent is typing..."
│   └── AgentAvatar.tsx      # Agent profile display
├── hooks/
│   ├── useChatSession.ts    # Session management
│   ├── useChatWebSocket.ts  # WebSocket connection
│   ├── useKBSearch.ts       # KB search
│   └── useAnnouncements.ts  # Fetch announcements
└── context/
    └── ChatContext.tsx      # Global chat state
```

### WebSocket Connection

```typescript
// hooks/useChatWebSocket.ts
import { useEffect, useRef, useState } from 'react';

interface ChatMessage {
  id: string;
  sender_type: 'visitor' | 'agent' | 'bot' | 'system';
  sender_name: string;
  content: string;
  content_type: 'text' | 'card';
  rich_content?: any;
  created_at: string;
}

export function useChatWebSocket(sessionKey: string) {
  const ws = useRef<WebSocket | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [agentTyping, setAgentTyping] = useState(false);

  useEffect(() => {
    const wsUrl = `${PRAXIS_WS_URL}/ws/chat/${sessionKey}/`;
    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => setIsConnected(true);
    ws.current.onclose = () => setIsConnected(false);

    ws.current.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case 'history':
          setMessages(data.messages);
          break;
        case 'message':
          setMessages(prev => [...prev, data.message]);
          break;
        case 'agent_joined':
          // Show "Agent joined" system message
          break;
        case 'typing':
          setAgentTyping(data.is_typing);
          break;
      }
    };

    return () => ws.current?.close();
  }, [sessionKey]);

  const sendMessage = (text: string) => {
    ws.current?.send(JSON.stringify({
      type: 'message',
      text,
    }));
  };

  const sendTyping = (isTyping: boolean) => {
    ws.current?.send(JSON.stringify({
      type: 'typing',
      is_typing: isTyping,
    }));
  };

  const requestAgent = () => {
    ws.current?.send(JSON.stringify({
      type: 'request_agent',
    }));
  };

  return {
    messages,
    isConnected,
    agentTyping,
    sendMessage,
    sendTyping,
    requestAgent,
  };
}
```

### Home Tab Layout

```typescript
// tabs/HomeTab.tsx
import { useState } from 'react';
import { useKBSearch } from '../hooks/useKBSearch';

export function HomeTab({ onStartChat, onArticleClick }) {
  const [searchQuery, setSearchQuery] = useState('');
  const { results, isSearching } = useKBSearch(searchQuery);

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-gradient-to-b from-indigo-600 to-indigo-500 p-6 text-white">
        <h1 className="text-2xl font-bold">Hi 👋</h1>
        <p className="text-lg">How can we help?</p>
      </div>

      {/* Search */}
      <div className="p-4 -mt-4">
        <div className="bg-white rounded-lg shadow-lg p-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search for help"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-10 py-2 border rounded-lg"
            />
            <SearchIcon className="absolute right-3 top-2.5 text-gray-400" />
          </div>

          {/* Search Results / Featured Articles */}
          <div className="mt-4 space-y-2">
            {(results.length > 0 ? results : featuredArticles).map(article => (
              <ArticleCard
                key={article.slug}
                article={article}
                onClick={() => onArticleClick(article)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Featured Announcement */}
      <div className="p-4">
        <AnnouncementBanner />
      </div>

      {/* Start Chat CTA */}
      <div className="mt-auto p-4">
        <button
          onClick={onStartChat}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium"
        >
          Start a conversation
        </button>
      </div>
    </div>
  );
}
```

### Bottom Tab Navigation

```typescript
// ChatWidget.tsx
const tabs = [
  { id: 'home', label: 'Home', icon: HomeIcon },
  { id: 'messages', label: 'Messages', icon: ChatBubbleIcon, badge: unreadCount },
  { id: 'news', label: 'News', icon: MegaphoneIcon },
  { id: 'roadmap', label: 'Roadmap', icon: MapIcon },
  { id: 'help', label: 'Help', icon: QuestionIcon },
];

<nav className="flex border-t">
  {tabs.map(tab => (
    <button
      key={tab.id}
      onClick={() => setActiveTab(tab.id)}
      className={`flex-1 flex flex-col items-center py-2 ${
        activeTab === tab.id ? 'text-indigo-600' : 'text-gray-500'
      }`}
    >
      <tab.icon className="w-6 h-6" />
      <span className="text-xs mt-1">{tab.label}</span>
      {tab.badge > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5">
          {tab.badge}
        </span>
      )}
    </button>
  ))}
</nav>
```

### Agent Inbox (Praxis Admin)

```typescript
// AgentInbox.tsx
export function AgentInbox() {
  const { inbox, claimChat, resolveChat } = useAgentInbox();
  const [selectedSession, setSelectedSession] = useState(null);

  return (
    <div className="flex h-full">
      {/* Sidebar - Chat List */}
      <div className="w-80 border-r">
        <div className="p-4 border-b">
          <AgentStatusToggle />
        </div>

        <Tabs defaultValue="waiting">
          <TabsList>
            <TabsTrigger value="waiting">
              Waiting ({inbox.waiting.length})
            </TabsTrigger>
            <TabsTrigger value="mine">
              My Chats ({inbox.mine.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="waiting">
            {inbox.waiting.map(session => (
              <ChatListItem
                key={session.id}
                session={session}
                onClick={() => setSelectedSession(session)}
                onClaim={() => claimChat(session.id)}
              />
            ))}
          </TabsContent>

          <TabsContent value="mine">
            {inbox.mine.map(session => (
              <ChatListItem
                key={session.id}
                session={session}
                onClick={() => setSelectedSession(session)}
              />
            ))}
          </TabsContent>
        </Tabs>
      </div>

      {/* Main - Chat View */}
      <div className="flex-1 flex flex-col">
        {selectedSession ? (
          <ChatView
            session={selectedSession}
            onResolve={() => resolveChat(selectedSession.id)}
            onConvertToTicket={() => convertToTicket(selectedSession.id)}
          />
        ) : (
          <EmptyState message="Select a chat to view" />
        )}
      </div>

      {/* Right Panel - Context */}
      {selectedSession && (
        <div className="w-80 border-l p-4">
          <VisitorContext session={selectedSession} />
        </div>
      )}
    </div>
  );
}
```

---

## 10. Critical Infrastructure

### Region Detection Logic

Priority order for determining which region's operating hours to use:

```python
def get_visitor_region(session: ChatSession) -> str:
    """
    Determine region for operating hours lookup.
    Priority:
    1. Authenticated user's school region
    2. Geo-IP from Cloudflare headers
    3. Default region
    """
    # 1. Authenticated user → use their school's region
    if session.user and session.school:
        return session.school.region or 'default'

    # 2. Anonymous → use geo-IP from CF headers
    cf_country = session.visitor_metadata.get('cf_ipcountry', '')
    region_map = {
        'AU': 'au',
        'NZ': 'au',  # Use AU hours for NZ
        'GB': 'uk',
        'IE': 'uk',  # Use UK hours for Ireland
        'SG': 'sg',
        'MY': 'sg',  # Use SG hours for Malaysia
    }
    if cf_country in region_map:
        return region_map[cf_country]

    # 3. Fallback
    return 'default'
```

### Heartbeat & Abandon Detection

Visitor widget emits heartbeat every 30 seconds. Server marks session as abandoned if no heartbeat for 120 seconds.

```python
# Celery beat task - runs every minute
@shared_task
def check_abandoned_sessions():
    """Mark sessions as abandoned if visitor has gone quiet."""
    threshold = timezone.now() - timedelta(seconds=120)
    abandoned = ChatSession.objects.filter(
        status__in=['active', 'waiting', 'assigned'],
        last_heartbeat_at__lt=threshold
    )
    for session in abandoned:
        session.status = 'abandoned'
        session.save()
        # Notify assigned agent
        if session.assigned_agent:
            notify_agent_visitor_left(session)
```

### Message Delivery Guarantees

Client-side message acking prevents duplicates and ensures ordering:

```typescript
// Client sends message with temp_id
ws.send({
  type: 'message',
  text: 'Hello',
  temp_id: 'temp_abc123'  // Client-generated UUID
});

// Server responds with ack containing real_id
// { type: 'message_ack', temp_id: 'temp_abc123', real_id: 42 }

// Client reconciles: replace temp message with confirmed message
// If no ack within 5s, show retry option
```

### WebSocket Resilience

Client must implement exponential backoff reconnection for Railway Redis restarts:

```typescript
// hooks/useChatWebSocket.ts
const reconnect = () => {
  const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
  setTimeout(() => {
    setRetryCount(prev => prev + 1);
    connect();
  }, delay);
};

ws.onclose = () => {
  setIsConnected(false);
  reconnect();
};

ws.onopen = () => {
  setIsConnected(true);
  setRetryCount(0);  // Reset on successful connection
  // Request missed messages since last_message_id
};
```

### Cloudflare Considerations

If Cloudflare fronts the WebSocket endpoint:

- Enable WebSocket support in CF dashboard
- Increase idle timeout (default 100s may be too short)
- Disable Rocket Loader for chat widget pages
- Consider using CF Argo for reduced latency

---

## 11. Deployment Requirements

### Infrastructure

| Component | Service | Notes |
|-----------|---------|-------|
| WebSocket Server | Railway (Daphne) | ASGI server for Channels |
| Redis | Railway Redis | Channel layer backend |
| Database | Neon PostgreSQL | Existing |

### Environment Variables

```bash
# WebSocket
REDIS_URL=redis://...
DJANGO_SETTINGS_MODULE=config.settings.cloud

# ASGI
WEB_CONCURRENCY=2
ASGI_THREADS=4
```

### Railway Procfile Update

```
web: daphne -b 0.0.0.0 -p $PORT config.asgi:application
worker: celery -A config worker -l info
```

---

## 12. Success Metrics

### Primary Metrics

| Metric | Target | Description |
|--------|--------|-------------|
| Self-service resolution rate | > 60% | Chats resolved via KB, no agent needed |
| Average first response time | < 60 seconds | Time from visitor message to agent reply |
| Chat satisfaction rating | > 4.5/5 | Post-chat survey score |
| Lead capture rate (marketing) | > 15% | % of Lead Bot chats that capture email |
| Ticket conversion rate | < 20% | % of chats that become helpdesk tickets |

### Operational Metrics (Critical for Staffing)

| Metric | Description | Use Case |
|--------|-------------|----------|
| **Agent Occupancy** | `active_chats / max_concurrent_chats` per agent | Staffing decisions, workload balancing |
| **Deflection Rate** | `kb_resolved / (kb_resolved + agent_escalations)` | Measures KB effectiveness, content gaps |
| **Lead Quality** | % of leads with valid school + email | Sales pipeline quality |

### Analytics API Endpoints

```
GET /api/chat/analytics/overview/     # Dashboard summary
GET /api/chat/analytics/occupancy/    # Agent occupancy over time
GET /api/chat/analytics/deflection/   # KB deflection rates
GET /api/chat/analytics/lead-quality/ # Lead quality breakdown
GET /api/chat/analytics/sla/          # SLA compliance rates
```

---

## 13. Design Decisions (Resolved Feb 2026)

### 1. Sound Notifications
**Decision:** Configurable with sensible defaults

| User Type | Default Sound | Default Browser Notification | Configurable |
|-----------|---------------|------------------------------|--------------|
| Visitor (widget) | Muted | Off | Yes (widget settings) |
| Agent (Praxis) | On | On | Yes (user preferences) |
| Admin | Can set org-wide defaults | Can set org-wide defaults | Yes |

### 2. Operating Hours
**Decision:** Show offline status + auto-reply, with per-region support built in for future

| Phase | Behaviour |
|-------|-----------|
| **Initial** | Single set of operating hours (e.g., 9am-5pm AEST). Outside hours: show offline banner + auto-reply with expected response time. |
| **Future** | Per-region hours configuration. Widget detects visitor's region (or school's region for Pnyx users) and shows appropriate hours. |

Model designed with region support from the start:
```python
class OperatingHours(models.Model):
    region = models.CharField(max_length=10, default='default')  # 'default', 'au', 'uk'
    day_of_week = models.IntegerField()  # 0=Monday, 6=Sunday
    open_time = models.TimeField()
    close_time = models.TimeField()
    timezone = models.CharField(max_length=50)  # e.g., 'Australia/Sydney'
```

### 3. Chat History Retention
**Decision:** 2 years with 90-day archival

- Active chats: Main database for 90 days
- Archived chats: Cold storage after 90 days (still queryable)
- Full retention: 2 years before deletion
- Exception: Chats linked to contacts/schools/tickets retained as long as those records exist
- GDPR: Users can request deletion at any time

### 4. File Attachments
**Decision:** Different behaviour by widget type for security

| Widget | Users | File Uploads |
|--------|-------|--------------|
| **Lead Bot** (acrux.education) | Anonymous prospects | **No uploads** — text only |
| **User Bot** (Pnyx) | Authenticated teachers/admins | **Images + PDF** up to 5MB |

Allowed file types for User Bot:
- Images: PNG, JPG, JPEG, GIF, WebP
- Documents: PDF only
- Max size: 5MB per file
- Max files per message: 3
- Storage: Cloudflare R2

### 5. Proactive Chat
**Decision:** None — widget opens only when visitor clicks it

No auto-popups, no timed triggers, no exit-intent modals. The chat launcher button is visible but unobtrusive. Users engage when they choose to.
