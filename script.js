// Import the Supabase client library
import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm';

// --- Supabase Configuration ---
// IMPORTANT: For local setup, you must replace these with your own Supabase project URL and anon key.
// Follow the instructions in the README.md file.
 const supabaseUrl = 'YOUR_SUPABASE_URL';
    const supabaseAnonKey = 'YOUR_SUPABASE_ANON_KEY'; // Replace with your Supabase anon key

// --- Initialize Supabase ---
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// --- Global State ---
let books = [];
let users = [];
let transactions = [];

// --- Modal Logic ---
const modal = document.getElementById("messageModal");
const modalMessage = document.getElementById("modalMessage");
const closeModalBtn = document.getElementById("closeModalBtn");

function showModal(message) {
    modalMessage.textContent = message;
    modal.style.display = "block";
}

closeModalBtn.onclick = function() {
    modal.style.display = "none";
}

window.onclick = function(event) {
    if (event.target == modal) {
        modal.style.display = "none";
    }
}

// --- Data Fetching and Real-time Subscriptions ---

async function fetchData() {
    // Fetch initial data
    const { data: booksData, error: booksError } = await supabase.from('books').select('*');
    if (booksError) console.error('Error fetching books:', booksError);
    else books = booksData;

    const { data: usersData, error: usersError } = await supabase.from('users').select('*');
    if (usersError) console.error('Error fetching users:', usersError);
    else users = usersData;

    const { data: transactionsData, error: transactionsError } = await supabase.from('transactions').select('*');
    if (transactionsError) console.error('Error fetching transactions:', transactionsError);
    else transactions = transactionsData;

    // Render everything
    renderAll();
}

function subscribeToChanges() {
    // Listen for any changes in the database
    supabase.channel('public:tables')
        .on('postgres_changes', { event: '*', schema: 'public' }, payload => {
            console.log('Change received!', payload);
            fetchData(); // Refetch all data on any change
        })
        .subscribe();
}

// --- Rendering Functions ---
function renderAll() {
    renderBooks();
    renderUsers();
    renderBorrowedBooks();
    populateSelects();
}

function renderBooks() {
    const bookList = document.getElementById('bookList');
    bookList.innerHTML = '';
    books.forEach(book => {
        const row = `<tr>
            <td class="px-4 py-2 whitespace-nowrap">${book.title}</td>
            <td class="px-4 py-2 whitespace-nowrap">${book.author}</td>
            <td class="px-4 py-2 whitespace-nowrap">${book.available} / ${book.quantity}</td>
        </tr>`;
        bookList.innerHTML += row;
    });
}

function renderUsers() {
    const userList = document.getElementById('userList');
    userList.innerHTML = '';
    users.forEach(user => {
        const statusClass = user.active ? 'text-green-600' : 'text-red-600';
        const statusText = user.active ? 'Active' : 'Inactive';
        const row = `<tr>
            <td class="px-4 py-2 whitespace-nowrap">${user.name}</td>
            <td class="px-4 py-2 whitespace-nowrap ${statusClass}">${statusText}</td>
        </tr>`;
        userList.innerHTML += row;
    });
}

function renderBorrowedBooks() {
    const borrowedList = document.getElementById('borrowedList');
    borrowedList.innerHTML = '';
    const borrowed = transactions.filter(t => t.status === 'borrowed');

    for (const trans of borrowed) {
        const book = books.find(b => b.id === trans.book_id);
        const user = users.find(u => u.id === trans.user_id);

        if (book && user) {
            const issueDate = new Date(trans.issue_date).toLocaleDateString();
            const row = `<tr>
                <td class="px-4 py-2 whitespace-nowrap">${book.title}</td>
                <td class="px-4 py-2 whitespace-nowrap">${user.name}</td>
                <td class="px-4 py-2 whitespace-nowrap">${issueDate}</td>
            </tr>`;
            borrowedList.innerHTML += row;
        }
    }
}

function populateSelects() {
    const issueBookSelect = document.getElementById('issueBookSelect');
    const issueUserSelect = document.getElementById('issueUserSelect');
    const returnTransactionSelect = document.getElementById('returnTransactionSelect');
    const deregisterUserSelect = document.getElementById('deregisterUserSelect');

    issueBookSelect.innerHTML = '<option value="">Select a Book to Issue</option>';
    books.filter(b => b.available > 0).forEach(book => {
        issueBookSelect.innerHTML += `<option value="${book.id}">${book.title} by ${book.author}</option>`;
    });

    issueUserSelect.innerHTML = '<option value="">Select a User</option>';
    users.filter(u => u.active).forEach(user => {
        issueUserSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });

    returnTransactionSelect.innerHTML = '<option value="">Select a Book to Return</option>';
    transactions.filter(t => t.status === 'borrowed').forEach(trans => {
        const book = books.find(b => b.id === trans.book_id);
        const user = users.find(u => u.id === trans.user_id);
        if (book && user) {
            returnTransactionSelect.innerHTML += `<option value="${trans.id}">${book.title} (borrowed by ${user.name})</option>`;
        }
    });

    deregisterUserSelect.innerHTML = '<option value="">Select a User to Deregister</option>';
    users.filter(u => u.active).forEach(user => {
        deregisterUserSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });
}

// --- Event Handlers ---
document.getElementById('addBookBtn').addEventListener('click', async () => {
    const title = document.getElementById('bookTitle').value.trim();
    const author = document.getElementById('bookAuthor').value.trim();
    const quantity = parseInt(document.getElementById('bookQuantity').value);

    if (!title || !author || isNaN(quantity) || quantity <= 0) {
        showModal("Please fill in all book fields correctly.");
        return;
    }

    const { error } = await supabase.from('books').insert([{ title, author, quantity, available: quantity }]);
    if (error) {
        console.error("Error adding book: ", error);
        showModal(`Error adding book: ${error.message}`);
    } else {
        showModal("Book added successfully!");
        document.getElementById('bookTitle').value = '';
        document.getElementById('bookAuthor').value = '';
        document.getElementById('bookQuantity').value = '';
    }
});

document.getElementById('registerUserBtn').addEventListener('click', async () => {
    const name = document.getElementById('userName').value.trim();
    if (!name) {
        showModal("Please enter a user name.");
        return;
    }

    const { error } = await supabase.from('users').insert([{ name, active: true }]);
    if (error) {
        console.error("Error registering user: ", error);
        showModal(`Error registering user: ${error.message}`);
    } else {
        showModal("User registered successfully!");
        document.getElementById('userName').value = '';
    }
});

document.getElementById('deregisterUserBtn').addEventListener('click', async () => {
    const userId = document.getElementById('deregisterUserSelect').value;
    if (!userId) {
        showModal("Please select a user to deregister.");
        return;
    }

    const hasBorrowedBooks = transactions.some(t => t.user_id == userId && t.status === 'borrowed');
    if (hasBorrowedBooks) {
        showModal("Cannot deregister user. They have outstanding borrowed books.");
        return;
    }

    const { error } = await supabase.from('users').update({ active: false }).eq('id', userId);
    if (error) {
        console.error("Error deregistering user: ", error);
        showModal(`Error deregistering user: ${error.message}`);
    } else {
        showModal("User deregistered successfully.");
    }
});

document.getElementById('issueBookBtn').addEventListener('click', async () => {
    const bookId = document.getElementById('issueBookSelect').value;
    const userId = document.getElementById('issueUserSelect').value;

    if (!bookId || !userId) {
        showModal("Please select a book and a user.");
        return;
    }

    const book = books.find(b => b.id == bookId);
    if (book && book.available > 0) {
        // 1. Decrease available count in the books table
        const { error: updateError } = await supabase.from('books').update({ available: book.available - 1 }).eq('id', bookId);
        if (updateError) {
            showModal(`Error updating book count: ${updateError.message}`);
            return;
        }

        // 2. Create a new transaction record
        const { error: insertError } = await supabase.from('transactions').insert([{
            book_id: bookId,
            user_id: userId,
            issue_date: new Date().toISOString(),
            status: 'borrowed'
        }]);

        if (insertError) {
            showModal(`Error creating transaction: ${insertError.message}`);
            // Revert the book count if the transaction fails
            await supabase.from('books').update({ available: book.available }).eq('id', bookId);
        } else {
            showModal("Book issued successfully!");
        }
    } else {
        showModal("Book is not available.");
    }
});

document.getElementById('returnBookBtn').addEventListener('click', async () => {
    const transactionId = document.getElementById('returnTransactionSelect').value;
    if (!transactionId) {
        showModal("Please select a transaction to return.");
        return;
    }

    const transaction = transactions.find(t => t.id == transactionId);
    if (transaction) {
        // 1. Update the transaction status and return date
        const { error: updateError } = await supabase.from('transactions').update({
            return_date: new Date().toISOString(),
            status: 'returned'
        }).eq('id', transactionId);

        if (updateError) {
            showModal(`Error updating transaction: ${updateError.message}`);
            return;
        }

        // 2. Increase the available book count
        const book = books.find(b => b.id === transaction.book_id);
        if (book) {
            const { error: bookUpdateError } = await supabase.from('books').update({ available: book.available + 1 }).eq('id', book.id);
            if (bookUpdateError) {
                showModal(`Error updating book count: ${bookUpdateError.message}`);
                // Note: In a real app, you'd handle this failure more gracefully.
            }
        }

        // 3. Calculate and display late fee
        const issueDate = new Date(transaction.issue_date);
        const returnDate = new Date();
        const diffTime = Math.abs(returnDate - issueDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const lateFee = Math.max(0, (diffDays - 14)) * 1; // $1 per day after 14 days

        showModal(`Book returned successfully. Late fee: $${lateFee.toFixed(2)}`);
    }
});

// --- Initial Load ---
document.addEventListener('DOMContentLoaded', () => {
    fetchData();
    subscribeToChanges();
});

