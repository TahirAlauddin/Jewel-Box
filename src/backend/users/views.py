from django.contrib.auth import authenticate, get_user_model
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.views import View
import json

User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class LoginView(View):
    def post(self, request, *args, **kwargs):
        # Parse the JSON request body
        try:
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
        except json.JSONDecodeError:
            return JsonResponse({'error': 'Invalid JSON'}, status=400)

        if not email or not password:
            return JsonResponse({'error': 'Email and password are required'}, status=400)

        # Try to fetch the user by email (assuming your user model uses email as the username field)
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

        # Authenticate the user
        user = authenticate(request, username=email, password=password)
        if user is not None:
            # Login successful
            # You can use Django's login function here if you're using Django's session-based authentication
            return JsonResponse({'message': 'Login successful'}, status=200)
        else:
            # Login failed
            return JsonResponse({'error': 'Invalid credentials'}, status=401)

# In urls.py, make sure to connect this view to a URL.
