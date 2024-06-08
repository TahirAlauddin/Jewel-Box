let currentPage = 1;
const resultsPerPage = 10;
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
    fetchResults(page);
}

function updatePaginationDisplay() {

    if (totalPages === 1) {
        document.getElementById('pagination').remove()
        return;
    } 
    document.getElementById('current-page').innerText = currentPage;
    document.querySelector('.out-of-results').innerText = `${(currentPage - 1) * resultsPerPage + 1}-${Math.min(currentPage * resultsPerPage, totalResults)} out of ${totalResults} customers`;

    document.getElementById('pagination-page-input').value = currentPage

    document.getElementById('first').disabled = currentPage === 1;
    document.getElementById('prev').disabled = currentPage === 1;
    document.getElementById('next').disabled = currentPage === totalPages;
    document.getElementById('last').disabled = currentPage === totalPages;
}

async function fetchResults(page) {
    try {
        const response = await fetch(`${BASE_URL}/order/?page=${page}`);
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

// Initial setup
fetchResults(currentPage);
