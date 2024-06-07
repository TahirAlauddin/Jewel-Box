#!python3
import win32com.client
import pythoncom


def print_sheet(file_path):
    excel = win32com.client.Dispatch("Excel.Application", pythoncom.CoInitialize())
    excel.Visible = False  # Make the application invisible

    # Open the Excel file
    workbook = excel.Workbooks.Open(file_path)

    # Print the workbook
    workbook.PrintOut()

    # Close the workbook without saving
    workbook.Close(SaveChanges=False)

    # Quit the Excel application
    excel.Quit()


if __name__ == '__main__':
    # print_sheet('Production Sheet.xlsx')
    print_sheet(r'C:\Users\Hi\OneDrive\Desktop\Projects\Jewel Box\backend\orders\Production Sheet.xlsx')
