npm install --save-dev electron-packager
<!-- Package Client -->
npx electron-packager . JewelBox --platform=win32 --arch=x64 --icon="jewel-box-logo.ico" 

<!-- Server exe -->
pyinstaller  --additional-hooks-dir=hooks manage.py

<!-- Updater exe -->
pyinstaller --distpath .\frontend\JewelBox-win32-x64\ .\updater.py

Migrate AWS-SDK for Javascript v2 to v3