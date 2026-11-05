from django.core.management.base import BaseCommand

from infinsight.guest import purge_expired_guest_data


class Command(BaseCommand):
    help = "Delete expired guest (non-login) Infinsight sessions: files, Pinecone vectors and chats."

    def handle(self, *args, **options):
        n = purge_expired_guest_data()
        self.stdout.write(self.style.SUCCESS(f"Purged {n} expired guest session(s)."))
