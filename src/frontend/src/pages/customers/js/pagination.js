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
    document.querySelector('.out-of-results').innerText = `${(currentPage - 1) * resultsPerPage + 1}-${Math.min(currentPage * resultsPerPage, totalResults)} out of ${totalResults} customers`;

    document.getElementById('pagination-page-input').value = currentPage

    document.getElementById('first').disabled = currentPage === 1;
    document.getElementById('prev').disabled = currentPage === 1;
    document.getElementById('next').disabled = currentPage === totalPages;
    document.getElementById('last').disabled = currentPage === totalPages;
}

async function fetchResults(page, search='') {
    try {
        const response = await fetch(`${BASE_URL}/customer-main/?page=${page}&search=${search}`);
        const data = await response.json();

        // Update totalResults and totalPages based on the response
        totalResults = data.count;
        totalPages = Math.ceil(totalResults / resultsPerPage);

        if (document.getElementById('pagination')) {
            document.getElementById('total-pages').textContent = totalPages
            document.getElementById('pagination-page-input').max = totalPages
            document.getElementById('pagination-page-input').min = 0
        }

        // Update the DOM with the fetched data
        populateTableWithData(data.results);

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

// Initial setup
fetchResults(currentPage);
