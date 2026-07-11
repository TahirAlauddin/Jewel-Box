import os
import openpyxl
import win32api
import win32print

# Set the directory where your Excel files are stored
directory = '.'

# Get the default printer
printer_name = win32print.GetDefaultPrinter()

# Loop through all files in the directory
for filename in os.listdir(directory):
    if filename.endswith('.xlsx'):
        file_path = os.path.join(directory, filename)
        # Print the file
        win32api.ShellExecute(0, "print", file_path, None, ".", 0)
