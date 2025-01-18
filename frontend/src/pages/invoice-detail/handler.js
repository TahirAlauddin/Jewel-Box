ipcRenderer.on('page-data', (event, args) => {
    // Call the function to populate data on page load or when needed

    populateInvoice(args.id);
});
