from PyInstaller.utils.hooks import collect_submodules

hiddenimports = []

# Read the requirements.txt file
with open('requirements.txt', 'r') as file:
    lines = file.readlines()
    for line in lines:
        # Extract the package name before any version specifier
        package = line.split('==')[0].split('>=')[0].split('<=')[0].strip()
        hiddenimports.extend(collect_submodules(package))
