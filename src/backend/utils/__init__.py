from barcode import Code128
from barcode.writer import ImageWriter

def create_barcode(data, file_path):
    """
    Creates a barcode from a given string and saves it as an image.
    
    Args:
    - data (str): The data string to be converted into a barcode.
    - file_path (str): The file path where the barcode image will be saved.
    
    Returns:
    - None
    """
    # Ensure the data is a 12-digit string for Code128
    if len(data) > 12:
        data = data[:12]
    elif len(data) < 12:
        data = data.ljust(12, 'x')

    # Create the barcode
    barcode = Code128(data, writer=ImageWriter())
    
    # Save the barcode image
    # barcode.save(file_path)
    barcode.save(file_path, {'write_text': False})

if __name__ == '__main__':
    # Example usage
    create_barcode("123456789EA1", ".")
