document.addEventListener('DOMContentLoaded', () => {
    const searchForm = document.getElementById('search-form');
    const ebookFilter = document.getElementById('ebook-filter');
    const sortRatingButton = document.getElementById('sort-rating');
    window.currentBooks = []; // Make it globally accessible for testing

    searchForm.addEventListener('submit', handleSearch);
    ebookFilter.addEventListener('change', handleFilter);
    sortRatingButton.addEventListener('click', handleSort);
});

async function searchBooks(query, type) {
    const queryType = {
        title: `intitle:${query}`,
        author: `inauthor:${query}`,
        isbn: `isbn:${query}`
    };

    const apiUrl = `https://www.googleapis.com/books/v1/volumes?q=${queryType[type]}&maxResults=10`;
    
    try {
        const response = await fetch(apiUrl);
        const data = await response.json();

        if (data.items) {
            return data.items.map(item => ({
                title: item.volumeInfo.title || 'Unknown Title',
                author_name: (item.volumeInfo.authors || []).join(', ') || 'Unknown Author',
                isbn: item.volumeInfo.industryIdentifiers
                    ? item.volumeInfo.industryIdentifiers[0].identifier
                    : 'N/A',
                cover_i: item.volumeInfo.imageLinks?.thumbnail || 'https://via.placeholder.com/128x192?text=No+Cover',
                ebook_access: item.accessInfo?.epub?.isAvailable ? 'Available' : 'Not Available',
                first_publish_year: item.volumeInfo.publishedDate?.split('-')[0] || 'Unknown Year',
                ratings_sortable: item.volumeInfo.averageRating || 0
            }));
        }
        return [];
    } catch (error) {
        console.error('Error fetching books:', error);
        return [];
    }
}

function displayBookList(books) {
    const bookList = document.getElementById('book-list');
    const selectedBook = document.getElementById('selected-book');

    bookList.innerHTML = '';
    selectedBook.classList.add('hidden');
    bookList.classList.remove('hidden');

    if (books.length === 0) {
        bookList.innerHTML = '<li>No books found.</li>';
        return;
    }

    books.forEach(book => {
        const li = document.createElement('li');
        li.className = 'book-item';
        li.innerHTML = `
            <div class="cover-element">
                <img src="${book.cover_i}" alt="Cover of ${book.title}">
            </div>
            <div class="title-element">${book.title}</div>
            <div class="author-element">${book.author_name}</div>
            <div class="rating-element">Rating: ${book.ratings_sortable || 'Unknown'}</div>
            <div class="ebook-element">eBook Access: ${book.ebook_access}</div>
        `;
        li.addEventListener('click', () => displaySingleBook(book));
        bookList.appendChild(li);
    });
}

function displaySingleBook(book) {
    const bookList = document.getElementById('book-list');
    const selectedBook = document.getElementById('selected-book');

    bookList.classList.add('hidden');
    selectedBook.classList.remove('hidden');

    selectedBook.innerHTML = `
        <div class="cover-element">
            <img src="${book.cover_i}" alt="Cover of ${book.title}">
        </div>
        <div class="title-element">${book.title}</div>
        <div class="author-element">${book.author_name}</div>
        <div class="published-element">First Published: ${book.first_publish_year}</div>
        <div class="ebook-element">eBook Access: ${book.ebook_access}</div>
        <div class="rating-element">Rating: ${book.ratings_sortable || 'Unknown'}</div>
        <div class="isbn-element">ISBN: ${book.isbn}</div>
        <button onclick="showBookList()">Back to Results</button>
    `;
}

function showBookList() {
    const bookList = document.getElementById('book-list');
    const selectedBook = document.getElementById('selected-book');
    
    selectedBook.classList.add('hidden');
    bookList.classList.remove('hidden');
}

async function handleSearch(event) {
    event.preventDefault();

    const searchInput = document.getElementById('search-input');
    const searchType = document.getElementById('search-type');

    const query = searchInput.value.trim();
    if (!query) {
        alert('Please enter a search term.');
        return;
    }

    try {
        const books = await searchBooks(query, searchType.value);
        window.currentBooks = books;
        displayBookList(books);
    } catch (error) {
        console.error('Error during search:', error);
        displayBookList([]);
    }
}

function handleFilter() {
    const ebookFilter = document.getElementById('ebook-filter');
    if (!window.currentBooks) return;

    const filteredBooks = ebookFilter.checked
        ? window.currentBooks.filter(book => book.ebook_access === 'Available')
        : window.currentBooks;

    displayBookList(filteredBooks);
}

function handleSort() {
    if (!window.currentBooks) return;

    const sortedBooks = [...window.currentBooks].sort((a, b) => {
        const ratingA = parseFloat(a.ratings_sortable) || 0;
        const ratingB = parseFloat(b.ratings_sortable) || 0;
        return ratingB - ratingA;
    });

    displayBookList(sortedBooks);
}