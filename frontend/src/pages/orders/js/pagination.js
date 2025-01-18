let currentPage = 1;
const resultsPerPage = 20;
let totalResults = 0;
let totalPages = 1;

document.getElementById('first').addEventListener('click', () => navigateToPage(1));
document.getElementById('prev').addEventListener('click', () => navigateToPage(currentPage - 1));
document.getElementById('next').addEventListener('click', () => navigateToPage(currentPage + 1));
document.getElementById('last').addEventListener('click', () => navigateToPage(totalPages));
document.getElementById('pagination-page-input').addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        const page = parseInt(event.target.value, 10);
        if (!isNaN(page)) {
            navigateToPage(page);
        }
    }
});
function navigateToPage(page) {
    if (page < 1 || page > totalPages) return;
    currentPage = page;
    updatePaginationDisplay();
    fetchResults(page, searchInput);
}

function updatePaginationDisplay() {

    if (totalPages === 1) {
        document.getElementById('pagination').classList.add('hidden')
        return;
    } else {
        document.getElementById('pagination').classList.remove('hidden')
    }

    document.getElementById('current-page').innerText = currentPage;
    document.querySelector('.out-of-results').innerText = `${(currentPage - 1) * resultsPerPage + 1}-${Math.min(currentPage * resultsPerPage, totalResults)} out of ${totalResults} orders`;

    document.getElementById('pagination-page-input').value = currentPage

    document.getElementById('first').disabled = currentPage === 1;
    document.getElementById('prev').disabled = currentPage === 1;
    document.getElementById('next').disabled = currentPage === totalPages;
    document.getElementById('last').disabled = currentPage === totalPages;
}

async function fetchResults(page, search = '') {
    try {
        const response = await fetch(`${BASE_URL}/order/?page=${page}&search=${search}`);
        const data = await response.json();

        // Update totalResults and totalPages based on the response
        totalResults = data.count;
        totalPages = Math.ceil(totalResults / resultsPerPage);

        document.getElementById('total-pages').textContent = totalPages
        document.getElementById('pagination-page-input').max = totalPages
        document.getElementById('pagination-page-input').min = 0

        const tableBody = document.getElementById('table-body');
        tableBody.innerHTML = '';

        // Update the DOM with the fetched data
        data.results.forEach(row => {
            addOrderRow(row);
        });

        // Update pagination display
        updatePaginationDisplay();
    } catch (error) {
        console.error('Error fetching results:', error);
    }
}


function resetPagination() {
    currentPage = 1;
    totalResults = 0;
    totalPages = 1;

    document.getElementById('current-page').innerText = currentPage;
    document.getElementById('total-pages').textContent = totalPages;
    document.getElementById('pagination-page-input').value = currentPage;
    document.getElementById('pagination-page-input').max = totalPages;
    document.getElementById('pagination-page-input').min = 0;

    document.getElementById('first').disabled = true;
    document.getElementById('prev').disabled = true;
    document.getElementById('next').disabled = true;
    document.getElementById('last').disabled = true;

    // Optionally fetch initial results again or clear the results display
    fetchResults(currentPage);
}

ipcRenderer.on("page-data", (event, data) => {
    if (data) {
        if (data[0]) {
            fetchResults(currentPage, data[0].searchParam);
            document.getElementById('search-input').value = data[0].searchParam;
            searchInput = data[0].searchParam
            return
        }
    }
    fetchResults(currentPage);
});  
