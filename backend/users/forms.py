from .models import User
from django.contrib.auth.forms import UserCreationForm, UserChangeForm
from django import forms

class CustomUserCreationForm(UserCreationForm):
    help_text = "An Email is required. Add a valid Email"
    email = forms.EmailField(max_length=60, help_text=help_text)
    class Meta(UserCreationForm.Meta):
        model = User
        fields = ('email', )


class CustomUserChangeForm(UserChangeForm):
    class Meta:
        model = User
        fields = UserChangeForm.Meta.fields
