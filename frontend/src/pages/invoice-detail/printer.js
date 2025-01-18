async function fetchPrinters() {
  try {
    const response = await fetch(`${BASE_URL}/printers-list/`);
    if (!response.ok) {
      throw new Error("Network response was not ok");
    }
    const data = await response.json();
    const printers = data.printers;
    console.log(printers);
    populatePrinterList(printers);
  } catch (error) {
    console.error("Failed to fetch printers:", error);
    alert("Failed to fetch printer list. Please try again later.");
  }
}

function populatePrinterList(printers) {
  const printerSelect = document.getElementById("printerSelect");
  printerSelect.innerHTML = ""; // Clear existing options

  printers.forEach((printer) => {
    const option = document.createElement("option");
    option.value = printer;
    option.textContent = printer;
    printerSelect.appendChild(option);
  });
}

function showModal() {
  const modal = document.getElementById("printerModal");
  modal.style.display = "block";
}

async function setPrinter() {
  return new Promise((resolve) => {
    // Show the modal and wait for the user to save the printer
    showModal();

    // Save the printer when the user confirms their selection
    window.savePrinter = () => {
      const printerName = document.getElementById("printerSelect").value;
      if (printerName) {
        localStorage.setItem("selectedPrinter", printerName);
        document.getElementById("printerModal").style.display = "none";
        resolve(printerName);
      }
    };
  });
}

async function selectPrinter() {
  let printer = localStorage.getItem("selectedPrinter");

  if (!printer) {
    // If printer not found, set a printer
    return await setPrinter();
  }
  return printer;
}

async function printInvoice() {

  try {
    const selectedPrinter = await selectPrinter();
    if (!selectedPrinter) {
      console.error("No printer selected");
      alert("No printer selected. Please try again.");
      return;
    }

    // Send a POST request to print invoices for the selected rows
    const response = await fetch(
      `${BASE_URL}/download-invoice/${currentInvoiceId}/`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ printer: selectedPrinter }),
      }
    );

    // Check if the request was successful
    if (response.ok) {
      const result = await response.json();

      if (result.success) {
        console.log("Invoices printed successfully.");
        const blob = await fetch(result.file_url).then((res) => res.blob());

        const tempAnchor = document.createElement("a");
        tempAnchor.href = window.URL.createObjectURL(blob);
        tempAnchor.download = "invoices.xlsx";
        tempAnchor.click();

        window.URL.revokeObjectURL(tempAnchor.href);
      } else {
        console.error("Printing failed:", result.error);
        alert(`Error printing invoices: ${result.error}`);
      }
    } else {
      console.error("Error printing invoices:", response.statusText);
      alert(`Error communicating with server: ${response.statusText}`);
    }
  } catch (error) {
    console.error("An error occurred while printing invoices:", error);
    alert(`Unexpected error: ${error.message}`);
  }
}
