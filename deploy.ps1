# Initialize Git
git init

# Add all files
git add .

# Commit (if changes exist)
if ((git status --porcelain) -ne "") {
    git commit -m "Initial commit of Top Horizon Report Card"
} else {
    Write-Host "Nothing to commit, proceeding..."
}

# Rename branch to main
git branch -M main

# Remove existing origin if it exists to avoid errors
if (git remote | Select-String "origin") {
    git remote remove origin
}

# Add remote
git remote add origin https://github.com/Onwodisunday/TOP-HORIZON-REPORT.git

# Push
Write-Host "Pushing to GitHub..."
git push -u origin main
