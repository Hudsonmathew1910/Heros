import os
import django
from django.test import Client
from django.core.files.uploadedfile import SimpleUploadedFile
from django.contrib.auth import get_user_model
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'hero_ai.settings')
django.setup()
User = get_user_model()
user = User.objects.first()
client = Client()
client.force_login(user)
f = SimpleUploadedFile('test.csv', b'col1,col2\n1,2', content_type='text/csv')
response = client.post('/infinsight/upload/', {'file': f})
print('STATUS CODE:', response.status_code)
print('RESPONSE:', response.content.decode('utf-8'))
