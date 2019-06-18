from django.db import models

class Project(models.Model):
    project_id = models.CharField(max_length=100)
    base_path = models.CharField(max_length=2000)
    title = models.CharField(max_length=200, default="")
    subtitle = models.CharField(max_length=1000, default="")
    description = models.CharField(max_length=5000, default="")
    creator = models.ForeignKey('User', on_delete=models.CASCADE)
    
class User(models.Model):
    email = models.CharField(max_length=50, unique=True)
    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    affiliation = models.CharField(max_length=500)
    username = models.CharField(max_length=50)
    hashed_password = models.CharField(max_length=200)
    is_admin = models.BooleanField(default=False)
    
    projects = models.ManyToManyField(Project, related_name='users')
    
    def natural_key(self):
        return {
            "email": self.email,
            "affiliation": self.affiliation,
            "username": self.username,
            "first_name": self.first_name,
            "last_name": self.last_name
        }
    