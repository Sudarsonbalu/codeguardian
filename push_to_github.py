import os
import requests
import base64
import getpass

def push_to_github():
    print("====================================================")
    print("   CodeGuardian AI - GitHub Direct Upload Script    ")
    print("====================================================")
    print("This script uploads the CodeGuardian codebase to your GitHub account")
    print("using GitHub's API, bypassing the need for a local Git installation.\n")
    
    token = getpass.getpass("Enter your GitHub Personal Access Token (PAT): ").strip()
    if not token:
        print("Error: GitHub Personal Access Token is required.")
        return
        
    username = "Sudarsonbalu"
    repo_name = "code-guardian"
    
    headers = {
        "Authorization": f"token {token}",
        "Accept": "application/vnd.github.v3+json"
    }
    
    # 1. Verify credentials and check/create repository
    repo_url = f"https://api.github.com/repos/{username}/{repo_name}"
    print(f"\nChecking repository status at '{username}/{repo_name}'...")
    res = requests.get(repo_url, headers=headers)
    
    if res.status_code == 404:
        print(f"Repository '{repo_name}' not found on your profile. Creating it now...")
        create_url = "https://api.github.com/user/repos"
        res = requests.post(create_url, headers=headers, json={
            "name": repo_name,
            "private": False,
            "description": "CodeGuardian AI - Enterprise AI Code Review Assistant",
            "auto_init": True  # Initializes with a README/main branch so we can upload contents easily
        })
        if res.status_code == 201:
            print("Repository created successfully!")
        else:
            print(f"Failed to create repository: {res.text}")
            return
    elif res.status_code == 200:
        print(f"Repository '{repo_name}' verified.")
    else:
        print(f"Failed to connect to GitHub (Status code: {res.status_code}). Please verify your token permissions. Response: {res.text}")
        return

    # 2. Gather project files
    exclude_dirs = {"venv", "node_modules", ".next", ".git", "__pycache__", "uploads", ".agents", "brain", ".system_generated"}
    exclude_files = {".env", ".env.local", "codeguardian.db", "test_codeguardian_db.db", "push_to_github.py"}
    
    project_dir = os.path.dirname(os.path.abspath(__file__))
    files_to_upload = []
    
    print("\nScanning project directory for files...")
    for root, dirs, files in os.walk(project_dir):
        # Exclude directories in-place to prevent os.walk from entering them
        dirs[:] = [d for d in dirs if d not in exclude_dirs]
        for file in files:
            if file in exclude_files or file.endswith(".pyc") or file.endswith(".db-journal"):
                continue
            abs_path = os.path.join(root, file)
            # Standardize paths to use forward slashes for GitHub repository structure
            rel_path = os.path.relpath(abs_path, project_dir).replace("\\", "/")
            files_to_upload.append((abs_path, rel_path))
            
    print(f"Found {len(files_to_upload)} files to upload.")
    
    # 3. Upload files to repository main branch
    print("\nUploading files to GitHub...")
    success_count = 0
    fail_count = 0
    
    for abs_path, rel_path in files_to_upload:
        try:
            with open(abs_path, "rb") as f:
                content = base64.b64encode(f.read()).decode("utf-8")
                
            file_url = f"https://api.github.com/repos/{username}/{repo_name}/contents/{rel_path}"
            
            # Check if the file already exists to obtain its blob SHA (required for file updates)
            sha = None
            file_res = requests.get(file_url, headers=headers)
            if file_res.status_code == 200:
                sha = file_res.json().get("sha")
                
            payload = {
                "message": f"Upload {rel_path} via CodeGuardian Uploader",
                "content": content,
                "branch": "main"
            }
            if sha:
                payload["sha"] = sha
                
            put_res = requests.put(file_url, headers=headers, json=payload)
            if put_res.status_code in [200, 201]:
                print(f" ✓ Uploaded: {rel_path}")
                success_count += 1
            else:
                print(f" ✗ Failed: {rel_path} (Status: {put_res.status_code})")
                fail_count += 1
        except Exception as e:
            print(f" ✗ Error reading/uploading '{rel_path}': {e}")
            fail_count += 1
            
    print("\n====================================================")
    print("                  Upload Summary                     ")
    print("====================================================")
    print(f"Successful uploads: {success_count}")
    print(f"Failed uploads:     {fail_count}")
    if fail_count == 0:
        print(f"\nAll set! Your project is available at: https://github.com/{username}/{repo_name}")
    else:
        print("\nSome files failed to upload. Please check the logs above.")

if __name__ == "__main__":
    push_to_github()
