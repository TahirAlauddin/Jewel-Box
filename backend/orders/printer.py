#!python3
import win32com.client
import pythoncom
import win32print


def print_sheet(file_path, printer_name=None):
    excel = win32com.client.Dispatch("Excel.Application", pythoncom.CoInitialize())
    excel.Visible = False  # Make the application invisible

    # Validate the printer name
    available_printers = [printer[2] for printer in win32print.EnumPrinters(2)]
    if printer_name and printer_name not in available_printers:
        return {"success": False, "error": f"Printer '{printer_name}' not found."}

     # Check if the printer name is valid
    if printer_name:
        available_printers = [printer[2] for printer in win32print.EnumPrinters(2)]
        if printer_name not in available_printers:
            raise ValueError(f"Printer '{printer_name}' not found. Available printers: {available_printers}")
        # Store the default printer
        defaultprinter = win32print.GetDefaultPrinter()
        # Set the printer if specified
        win32print.SetDefaultPrinter(printer_name)

    # Print the workbook
    try:
        workbook = excel.Workbooks.Open(file_path)
        workbook.PrintOut()
        workbook.Close(SaveChanges=False)
        # Set the default printer back to the original one
        win32print.SetDefaultPrinter(defaultprinter)
    except Exception as e:
        return {"success": False, "error": str(e)}
    finally:
        excel.Quit()

    return {"success": True}


if __name__ == '__main__':
    # print_sheet('Production Sheet.xlsx')
    print_sheet(r'C:\Users\Hi\OneDrive\Desktop\Projects\Jewel Box\backend\orders\Production Sheet.xlsx')
