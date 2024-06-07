async function productionSheetBtnHandler(id) {
    console.log("Trying to pinrt sheet")
    try {
        // Send a POST request to print production sheets for the selected rows
        const response = await fetch(`${BASE_URL}/print-production-sheet/`, {
            method: 'POST',
            headers: {
                // Add any headers if needed
            },
            body: JSON.stringify({ids: [id]})
        });

        // Check if the request was successful
        if (response.ok) {
            // Process the response data if needed
            // const data = await response.json();
            console.log('Production sheets printed successfully:');
            const blob = await response.blob();

            // Create a temporary anchor element
            const tempAnchor = document.createElement('a');
            tempAnchor.href = window.URL.createObjectURL(blob);
            tempAnchor.download = 'production_sheets.zip'; // Specify the file name
    
            // Trigger a click event to download the zip file
            // tempAnchor.click();
    
            // Clean up
            window.URL.revokeObjectURL(tempAnchor.href);
        } else {
            // Handle error response
            console.error('Error printing production sheets:', response.statusText);
        }
    } catch (error) {
        // Handle any unexpected errors
        console.error('An error occurred while printing production sheets:', error);
    }
}

