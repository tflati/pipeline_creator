"""django_server URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/2.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.urls import path
from pipeline_manager import views

urlpatterns = [
    path('projects/', views.projects),
    path('load_project/<project_id>/', views.load_project),
    path('save_project/', views.save_project),
    path('delete_project/', views.delete_project),
#     path('rename_project/', views.rename_project),
    path('produce_scripts/', views.produce_scripts),
    path('download_scripts/', views.download_scripts),
    path('download_csv/', views.download_csv),
    path('modules/<cluster_id>/<prefix>/', views.modules),
    path('modules/<cluster_id>/', views.modules),
    path('genomes/<cluster_id>/', views.genomes),
    path('upload_samples/', views.upload_samples),
    path('create_projects/', views.create_projects),
    path('test/', views.test)
]
