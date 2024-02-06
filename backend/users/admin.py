from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from users.forms import CustomUserCreationForm, CustomUserChangeForm
from .models import User


class CustomUserAdminConfig(UserAdmin):
    add_form = CustomUserCreationForm
    form = CustomUserChangeForm
    model = User
    search_fields = ('email',)
    list_filter = ('email', 'is_active', 'is_staff')
    list_display = ['email', 'is_staff', 'is_active']
    ordering = ('email', )    
    fieldsets = (
        (None, {'fields':('email',)}),
        ('Permissions', {'fields':('is_staff', 'is_active')})
    )

    add_fieldsets = (
                (None, {
            'classes': ('wide',),
            'fields': ('email', 'password1', 'password2',
            'is_active', 'is_staff')}
        ),
    )

                
admin.site.register(User, CustomUserAdminConfig)
