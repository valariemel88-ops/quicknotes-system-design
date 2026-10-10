
const API_URL = "https://jsonplaceholder.typicode.com/posts";

// Get the elements we need from the HTML page.
const loadButton = document.querySelector("#load-btn");
const notesList = document.querySelector("#notes-list");
const statusMessage = document.querySelector("#status");
const noteForm = document.querySelector("#note-form");
const titleInput = document.querySelector("#title-input");
const bodyInput = document.querySelector("#body-input");
const submitButton = document.querySelector("#submit-btn");

// English demonstration notes shown when the page first opens.
const sampleNotes = [
  {
    id: 1,
    title: "My Learning Goals",
    body: "Learn HTML, CSS, JavaScript, and API development."
  },
  {
    id: 2,
    title: "MeVaq Project",
    body: "Continue building and improving my AI workspace."
  },
  {
    id: 3,
    title: "Weekly Tasks",
    body: "Review coursework, practise coding, and update project documentation."
  },
  {
    id: 4,
    title: "Ideas for the Future",
    body: "Write down useful ideas and turn them into practical projects."
  },
  {
    id: 5,
    title: "Today's Reminder",
    body: "Keep learning, practise consistently, and celebrate progress."
  },
  {
    id: 6,
    title: "Project Planning",
    body: "Break large projects into smaller, manageable tasks."
  },
  {
    id: 7,
    title: "Important Reminders",
    body: "Keep track of deadlines and complete important tasks on time."
  },
  {
    id: 8,
    title: "New Ideas",
    body: "Record creative ideas before they are forgotten."
  },
  {
    id: 9,
    title: "Skills to Practise",
    body: "Practise writing functions, handling errors, and working with APIs."
  },
  {
    id: 10,
    title: "Personal Development",
    body: "Stay curious, learn from mistakes, and keep improving."
  }
];

// Track the notes currently displayed.
let notes = sampleNotes.map((note) => ({ ...note }));

// Track whether the displayed notes came from the server.
let notesSource = "examples";

// Display success, loading, and error messages.
function showStatus(message, type = "") {
  statusMessage.textContent = message;
  statusMessage.className = "status";

  if (type) {
    statusMessage.classList.add(type);
  }
}

// Reusable function for making HTTP requests.
async function request(url, options = {}) {
  const response = await fetch(url, options);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}.`);
  }

  if (response.status === 204) {
    return {
      data: null,
      status: response.status
    };
  }

  const data = await response.json();

  return {
    data,
    status: response.status
  };
}

// Safely create a note element using textContent.
function createNoteElement(note) {
  const listItem = document.createElement("li");
  listItem.className = "note-item";
  listItem.dataset.id = String(note.id);

  const title = document.createElement("h3");
  title.textContent = note.title;

  const body = document.createElement("p");
  body.textContent = note.body || "No note body provided.";

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "delete-btn";
  deleteButton.textContent = "Delete";

  deleteButton.addEventListener("click", () => {
    deleteNote(note.id, deleteButton);
  });

  listItem.append(title, body, deleteButton);

  return listItem;
}

// Display all current notes.
function renderNotes() {
  notesList.replaceChildren();

  if (notes.length === 0) {
    const emptyMessage = document.createElement("li");
    emptyMessage.className = "empty-message";
    emptyMessage.textContent = "No notes yet. Create your first note!";
    notesList.appendChild(emptyMessage);
    return;
  }

  const fragment = document.createDocumentFragment();

  notes.forEach((note) => {
    fragment.appendChild(createNoteElement(note));
  });

  notesList.appendChild(fragment);
}

// GET: Fetch and display the actual notes returned by the API.
async function loadNotes() {
  loadButton.disabled = true;
  showStatus("Loading notes from the server...");

  try {
    const result = await request(`${API_URL}?_limit=10`);

    // Use the actual records returned by the server.
    notes = result.data.map((post) => ({
      id: post.id,
      title: post.title,
      body: post.body
    }));

    notesSource = "server";

    renderNotes();

    if (notes.length === 0) {
      showStatus("The server returned no notes.", "success");
    } else {
      showStatus(
        `Loaded ${notes.length} notes from the server (status ${result.status}).`,
        "success"
      );
    }
  } catch (error) {
    showStatus(
      `Could not load notes. ${error.message}`,
      "error"
    );
  } finally {
    loadButton.disabled = false;
  }
}

// POST: Send a new note to the API.
async function createNote(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const body = bodyInput.value.trim();

  if (!title) {
    showStatus("Please enter a note title.", "error");
    titleInput.focus();
    return;
  }

  if (title.length > 100) {
    showStatus("The title must not exceed 100 characters.", "error");
    titleInput.focus();
    return;
  }

  submitButton.disabled = true;
  showStatus("Creating your note...");

  try {
    const result = await request(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        title,
        body,
        userId: 1
      })
    });

    // Use the ID returned by the server consistently.
    const newNote = {
      id: result.data.id,
      title: result.data.title,
      body: result.data.body || ""
    };

    // Show the created note at the top of the list.
    notes.unshift(newNote);
    renderNotes();

    noteForm.reset();

    showStatus(
      `Note created (status ${result.status}, id ${result.data.id}).`,
      "success"
    );

    /*
     * JSONPlaceholder simulates POST requests.
     * It does not permanently save the new note.
     */
  } catch (error) {
    showStatus(
      `Could not create the note. ${error.message}`,
      "error"
    );
  } finally {
    submitButton.disabled = false;
  }
}

// DELETE: Send a delete request for the selected note.
async function deleteNote(id, deleteButton) {
  deleteButton.disabled = true;
  showStatus("Deleting note...");

  try {
    const result = await request(`${API_URL}/${id}`, {
      method: "DELETE"
    });

    // Remove the note from the page after a successful response.
    notes = notes.filter((note) => note.id !== id);

    renderNotes();

    showStatus(
      `Delete request successful (status ${result.status}).`,
      "success"
    );

    /*
     * JSONPlaceholder simulates DELETE requests.
     * It does not permanently delete stored server data.
     */
  } catch (error) {
    showStatus(
      `Could not delete the note. ${error.message}`,
      "error"
    );

    deleteButton.disabled = false;
  }
}

// Connect the buttons and form to their functions.
loadButton.addEventListener("click", loadNotes);
noteForm.addEventListener("submit", createNote);

// Show English examples when the page first opens.
renderNotes();

showStatus(
  "Welcome! Your English demonstration notes are ready. Click Load Notes to fetch server records.",
  "success"
);
