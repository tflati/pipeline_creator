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
    path('register/', views.register),
    path('login/', views.login),
    path('logout/', views.logout),
    path('get_users_of_project/<project_id>', views.get_users_of_project),
    path('shareable_users/<project_id>', views.shareable_users),
    path('users/', views.users),
    path('save_users/', views.save_users),
    path('share_project/(.*)/(.*)', views.share_project),
    path('remove_share_project/(.*)/(.*)', views.remove_share_project),
    path('projects/', views.projects),
    path('load_project/<project_id>/', views.load_project),
    path('create_project/', views.create_project),
    path('save_project/', views.save_project),
    path('delete_project/<project_id>/', views.delete_project),
    path('import_pipelines/', views.import_pipelines),
    path('delete_pipeline/<project_id>/<pipeline_id>/', views.delete_pipeline),
#     path('rename_project/', views.rename_project),
    path('rename_pipeline/<project_id>/<pipeline_id>/<new_pipeline_id>/', views.rename_pipeline),
    path('produce_scripts/', views.produce_scripts),
    path('launch_scripts/<step>/', views.launch_scripts),
    path('launch_monitor_scripts/', views.launch_monitor_scripts),
    path('download_scripts/', views.download_scripts),
    path('download_phenodata/', views.download_phenodata),
    path('get_phenodata/<project_id>/<bioproject_id>/', views.get_phenodata),
    path('download_dataset/', views.download_dataset),
    path('modules/<username>/<hostname>/<prefix>/', views.modules),
    path('modules/<username>/<hostname>/', views.modules),
#     path('genomes/<cluster_id>/', views.genomes),
    path('accounts/<username>/<hostname>/<prefix>/', views.accounts),
    path('accounts/<username>/<hostname>/', views.accounts),
    path('get_cluster_users/<username>/<hostname>/', views.get_cluster_users),
    path('qos/<username>/<hostname>/', views.qos),
    path('pipelines/', views.pipelines),
    path('steps/', views.steps),
    path('templates/', views.templates),
    path('upload_dataset/', views.upload_dataset),
    path('add_papers/', views.add_papers),
    path('delete_paper/<project_id>/<paper_name>/', views.delete_paper),
    path('upload_phenodata/<project_id>/', views.upload_phenodata),
    path('upload_data/<project_id>/', views.upload_data),
    path('upload_pipeline_data/<project_id>/<pipeline_id>/', views.upload_pipeline_data),
    path('remove_data/<project_id>/', views.remove_data),
    path('remove_pipeline_data/<project_id>/<pipeline_id>/', views.remove_pipeline_data),
    path('save_pipeline_to_repository/<overwrite>/', views.save_pipeline_to_repository),
    path('save_monitor_pipeline_to_repository/<overwrite>/', views.save_monitor_pipeline_to_repository),
    path('save_step_to_repository/<overwrite>/', views.save_step_to_repository),
    path('delete_pipeline_from_repository/', views.delete_pipeline_from_repository),
    path('delete_step_from_repository/', views.delete_step_from_repository),
    path('rename_step_in_repository/<old_name>/<new_name>/', views.rename_step_in_repository),
    path('rename_pipeline_in_repository/<old_name>/<new_name>/', views.rename_pipeline_in_repository),
    path('save_monitor_step_to_repository/<overwrite>/', views.save_monitor_step_to_repository),
    path('upload_from_ID_list/', views.upload_from_ID_list),
    path('invoke_monitor/', views.invoke_monitor),
#     path('get_monitor_step_data/', views.get_monitor_step_data),
    path('filesystem_api/<op>/', views.filesystem_api),
    path('dataset_api/', views.dataset_api),
    path('job_search_api/', views.job_search_api),
    path('create_new_launch/<project_id>/', views.create_new_launch),
    path('remove_run/<project_id>/<run_id>/', views.remove_run),
    path('stop_jobs/<project_id>/<run_id>/', views.stop_jobs),
    path('download_project/<project_id>/', views.download_project),
    path('upload_temp/', views.upload_temp),
    path('see_top_lines/', views.see_top_lines),
    path('download_file/', views.download_file),
]
