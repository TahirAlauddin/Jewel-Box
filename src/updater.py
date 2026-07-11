import traceback
import zipfile
import shutil
import signal
# Ignore SIGINT signal (Ctrl+C)
signal.signal(signal.SIGINT, signal.SIG_IGN)
import os
import sys
import argparse
import boto3
import requests
from tqdm import tqdm

import dotenv
dotenv.load_dotenv()

# Access AWS API keys from environment variables
aws_access_key_id = os.environ.get('AWS_ACCESS_KEY')
aws_secret_access_key = os.environ.get('AWS_SECRET_KEY')

def download_file(url, destination):
    response = requests.get(url, stream=True)
    total_size = int(response.headers.get('content-length', 0))

    with open(destination, 'wb') as file, tqdm(
        desc=destination,
        total=total_size,
        unit='B',
        unit_scale=True,
        unit_divisor=1024,
    ) as bar:
        for data in response.iter_content(chunk_size=1024):
            file.write(data)
            bar.update(len(data))


def install_update(zip_file):
    try:
        # Get the directory where the zip file is located
        directory = os.path.dirname(zip_file)
        # Create a temporary directory for extraction
        temp_dir = os.path.join(directory, 'temp_extract')

        # Extract the contents of the zip file to the temporary directory
        with zipfile.ZipFile(zip_file, 'r') as zip_ref:
            zip_ref.extractall(path=temp_dir)

        # Move extracted files to destination directory, replacing existing files if necessary
        for root, dirs, files in os.walk(temp_dir):
            for item in files:
                item_path = os.path.join(root, item)
                destination_path = os.path.join(directory, os.path.relpath(item_path, temp_dir))

                # Check if the item exists in the temporary directory
                if os.path.exists(item_path):
                    # Remove the item in the destination directory if it already exists
                    if os.path.exists(destination_path):
                        os.remove(destination_path)

                    # Move the extracted file to the destination directory
                    shutil.move(item_path, destination_path, copy_function=shutil.copy2)

            for dir_name in dirs:
                dir_path = os.path.join(root, dir_name)
                destination_dir = os.path.join(directory, os.path.relpath(dir_path, temp_dir))

                # Create the directory in the destination directory if it doesn't exist
                if not os.path.exists(destination_dir):
                    os.makedirs(destination_dir)

        # Remove any empty directories in the destination directory
        for root, dirs, files in os.walk(directory, topdown=False):
            for dir_name in dirs:
                dir_path = os.path.join(root, dir_name)
                if not os.listdir(dir_path):
                    os.rmdir(dir_path)

        print(f"Installation of version {zip_file} completed successfully!")
                
    except Exception as e:
        print(f"Error installing version {zip_file}: {e}")
        # If installation fails, restore original files from backup directory
        

def main(bucket_name, object_key, download_path):
    s3 = boto3.client('s3', region_name='us-east-2', aws_access_key_id=aws_access_key_id, aws_secret_access_key=aws_secret_access_key)
    try:
        response = s3.generate_presigned_url('get_object', Params={'Bucket': bucket_name, 'Key': object_key})
        download_file(response, download_path)
        install_update(download_path)
        os.remove(download_path)  # Remove the downloaded zip file after installation
        print("Installation completed successfully!")
        input("Press Enter to exit...")

    except Exception as e:
        print("An error occurred:")
        traceback.print_exc()
        input("Press Enter to exit...")
        sys.exit(1)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description='Download and install the latest version from an S3 bucket.')
    parser.add_argument('bucket_name',
                         help='Name of the S3 bucket')
    parser.add_argument('object_key',
                         help='Object key of the latest version zip file in the S3 bucket')
    parser.add_argument('download_path',
                         help='Path to save the downloaded version zip file')

    args = parser.parse_args()
    main(args.bucket_name, args.object_key, args.download_path)
