// Firebase Imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, onSnapshot, doc, updateDoc, query, where, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";

// --- Firebase Configuration ---
// NOTE: The firebaseConfig and __app_id are provided by the environment.
// Do not replace them with your own configuration.
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : { apiKey: "your-api-key", authDomain: "your-auth-domain", projectId: "your-project-id" };
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-library-app';

// --- Initialize Firebase ---
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// --- Global State ---
let userId = null;
let books = [];
let users = [];
let transactions = [];

// --- Authentication ---
onAuthStateChanged(auth, async (user) => {
    if (user) {
        userId = user.uid;
        console.log("User is signed in with UID:", userId);
        initializeAppState();
    } else {
        console.log("User is signed out. Signing in anonymously.");
        try {
             if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
                await signInWithCustomToken(auth, __initial_auth_token);
            } else {
                await signInAnonymously(auth);
            }
        } catch (error) {
            console.error("Error signing in:", error);
            showModal(`Error signing in: ${error.message}`);
        }
    }
});


// --- Firestore Collection References ---
const getBooksCollection = () => collection(db, `artifacts/${appId}/public/data/books`);
const getUsersCollection = () => collection(db, `artifacts/${appId}/public/data/users`);
const getTransactionsCollection = () => collection(db, `artifacts/${appId}/public/data/transactions`);

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


// --- Main Application Logic ---
function initializeAppState() {
    if (!userId) return;

    // Listen for real-time updates
    onSnapshot(getBooksCollection(), (snapshot) => {
        books = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBooks();
        populateSelects();
    });

    onSnapshot(getUsersCollection(), (snapshot) => {
        users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderUsers();
        populateSelects();
    });

    onSnapshot(getTransactionsCollection(), (snapshot) => {
        transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        renderBorrowedBooks();
        populateSelects();
    });
}

// --- Rendering Functions ---
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

async function renderBorrowedBooks() {
    const borrowedList = document.getElementById('borrowedList');
    borrowedList.innerHTML = '';
    const borrowed = transactions.filter(t => t.status === 'borrowed');

    for (const trans of borrowed) {
         const book = books.find(b => b.id === trans.bookId);
         const user = users.find(u => u.id === trans.userId);

         if (book && user) {
            const issueDate = new Date(trans.issueDate).toLocaleDateString();
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

    // Populate issue book select
    issueBookSelect.innerHTML = '<option value="">Select a Book to Issue</option>';
    books.filter(b => b.available > 0).forEach(book => {
        issueBookSelect.innerHTML += `<option value="${book.id}">${book.title} by ${book.author}</option>`;
    });

    // Populate issue user select
    issueUserSelect.innerHTML = '<option value="">Select a User</option>';
    users.filter(u => u.active).forEach(user => {
        issueUserSelect.innerHTML += `<option value="${user.id}">${user.name}</option>`;
    });

    // Populate return transaction select
    returnTransactionSelect.innerHTML = '<option value="">Select a Book to Return</option>';
    transactions.filter(t => t.status === 'borrowed').forEach(trans => {
        const book = books.find(b => b.id === trans.bookId);
        const user = users.find(u => u.id === trans.userId);
        if (book && user) {
            returnTransactionSelect.innerHTML += `<option value="${trans.id}">${book.title} (borrowed by ${user.name})</option>`;
        }
    });

    // Populate deregister user select
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

    try {
        await addDoc(getBooksCollection(), {
            title,
            author,
            quantity,
            available: quantity
        });
        showModal("Book added successfully!");
        document.getElementById('bookTitle').value = '';
        document.getElementById('bookAuthor').value = '';
        document.getElementById('bookQuantity').value = '';
    } catch (error) {
        console.error("Error adding book: ", error);
        showModal(`Error adding book: ${error.message}`);
    }
});

document.getElementById('registerUserBtn').addEventListener('click', async () => {
    const name = document.getElementById('userName').value.trim();
    if (!name) {
        showModal("Please enter a user name.");
        return;
    }

    try {
        await addDoc(getUsersCollection(), {
            name,
            active: true
        });
        showModal("User registered successfully!");
        document.getElementById('userName').value = '';
    } catch (error) {
        console.error("Error registering user: ", error);
        showModal(`Error registering user: ${error.message}`);
    }
});

document.getElementById('deregisterUserBtn').addEventListener('click', async () => {
    const selectedUserId = document.getElementById('deregisterUserSelect').value;
    if (!selectedUserId) {
        showModal("Please select a user to deregister.");
        return;
    }

    // Check if user has any borrowed books
    const hasBorrowedBooks = transactions.some(t => t.userId === selectedUserId && t.status === 'borrowed');
    if(hasBorrowedBooks) {
        showModal("Cannot deregister user. They have outstanding borrowed books.");
        return;
    }

    try {
        const userDocRef = doc(getUsersCollection(), selectedUserId);
        await updateDoc(userDocRef, { active: false });
        showModal("User deregistered successfully.");
    } catch (error) {
        console.error("Error deregistering user: ", error);
        showModal(`Error deregistering user: ${error.message}`);
    }
});


document.getElementById('issueBookBtn').addEventListener('click', async () => {
    const bookId = document.getElementById('issueBookSelect').value;
    const selectedUserId = document.getElementById('issueUserSelect').value;

    if (!bookId || !selectedUserId) {
        showModal("Please select a book and a user.");
        return;
    }

    const bookDocRef = doc(getBooksCollection(), bookId);

    try {
        const bookDoc = await getDoc(bookDocRef);
        if (bookDoc.exists() && bookDoc.data().available > 0) {
            // Decrease available count
            await updateDoc(bookDocRef, {
                available: bookDoc.data().available - 1
            });

            // Create transaction record
            await addDoc(getTransactionsCollection(), {
                bookId,
                userId: selectedUserId,
                issueDate: new Date().toISOString(),
                returnDate: null,
                status: 'borrowed'
            });

            showModal("Book issued successfully!");
        } else {
            showModal("Book is not available.");
        }
    } catch (error) {
        console.error("Error issuing book: ", error);
        showModal(`Error issuing book: ${error.message}`);
    }
});

document.getElementById('returnBookBtn').addEventListener('click', async () => {
    const transactionId = document.getElementById('returnTransactionSelect').value;
    if (!transactionId) {
        showModal("Please select a transaction to return.");
        return;
    }

    const transactionDocRef = doc(getTransactionsCollection(), transactionId);

    try {
        const transactionDoc = await getDoc(transactionDocRef);
        if (transactionDoc.exists()) {
            const transactionData = transactionDoc.data();
            const bookId = transactionData.bookId;
            const bookDocRef = doc(getBooksCollection(), bookId);

            // Update transaction
            await updateDoc(transactionDocRef, {
                returnDate: new Date().toISOString(),
                status: 'returned'
            });

            // Increase available book count
            const bookDoc = await getDoc(bookDocRef);
            if (bookDoc.exists()) {
                await updateDoc(bookDocRef, {
                    available: bookDoc.data().available + 1
                });
            }

            // Calculate late fee
            const issueDate = new Date(transactionData.issueDate);
            const returnDate = new Date();
            const diffTime = Math.abs(returnDate - issueDate);
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            const lateFee = Math.max(0, (diffDays - 14)) * 1; // $1 per day after 14 days
            
            showModal(`Book returned successfully. Late fee: $${lateFee.toFixed(2)}`);

        }
    } catch (error) {
        console.error("Error returning book: ", error);
        showModal(`Error returning book: ${error.message}`);
    }
});
