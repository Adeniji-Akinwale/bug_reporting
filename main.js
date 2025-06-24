const API_BASE = 'http://localhost:5000/api/bugs';
const currentPage = window.location.pathname.split('/').pop() || 'index.html';

// Utility: Show error message
function showError(message, pageId = 'error') {
  const errorDiv = document.getElementById(pageId);
  if (errorDiv) {
    errorDiv.textContent = message;
    errorDiv.classList.remove('hidden');
    errorDiv.classList.add('show');
  } else {
    alert(message);
  }
}

// Utility: Clear error message
function clearError(pageId = 'error') {
  const errorDiv = document.getElementById(pageId);
  if (errorDiv) {
    errorDiv.textContent = '';
    errorDiv.classList.add('hidden');
    errorDiv.classList.remove('show');
  }
}

// Load bugs (index.html)
async function loadBugs() {
  clearError();
  try {
    const response = await fetch(API_BASE);
    if (!response.ok) throw new Error('Failed to fetch bugs');
    const bugs = await response.json();
    const tbody = document.getElementById('bug-table-body');
    if (!tbody) return;

    tbody.innerHTML = bugs.length === 0
      ? '<tr><td colspan="5" class="py-2 px-4 text-center">No bugs found</td></tr>'
      : bugs.map((bug, index) => `
        <tr>
          <td>${index + 1}</td> <!-- Custom row number starting from 1 -->
          <td class="title-cell" onclick="toggleTooltip(this)" onmouseover="showTooltip(this)" onmouseout="hideTooltip(this)">
            ${bug.title}
            <span class="tooltip">${bug.description || 'No description'}</span>
          </td>
          <td class="priority-${bug.priority.toLowerCase()}">${bug.priority}</td> <!-- Dynamic class -->
          <td>${bug.status}</td>
          <td class="actions">
            <a href="edit.html?id=${bug.id}">Edit</a>
            <button onclick="deleteBug(${bug.id})">Delete</button>
          </td>
        </tr>
      `).join('');
  } catch (err) {
    showError(err.message);
  }
}

// Delete bug
async function deleteBug(id) {
  if (!confirm('Are you sure you want to delete this bug?')) return;
  clearError();
  try {
    const response = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
    if (!response.ok) throw new Error('Failed to delete bug');
    await loadBugs(); // Refresh list with new numbering
  } catch (err) {
    showError(err.message);
  }
}

// Create bug (create.html)
async function initCreateForm() {
  const form = document.getElementById('create-bug-form');
  const submitBtn = document.getElementById('submit-btn');

  if (!form || !submitBtn) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const formData = new FormData(form);
    const data = {
      title: formData.get('title').trim(),
      description: formData.get('description').trim(),
      priority: formData.get('priority'),
    };

    const validation = validateBug(data);
    if (validation !== true) return showError(validation);

    try {
      submitBtn.textContent = 'Creating...';
      submitBtn.disabled = true;

      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to create bug');
      window.location.href = 'index.html'; // Redirect to refresh
    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.textContent = 'Create Bug';
      submitBtn.disabled = false;
    }
  });
}

// Edit bug (edit.html)
async function initEditForm() {
  const form = document.getElementById('edit-bug-form');
  const submitBtn = document.getElementById('submit-btn');
  const bugId = new URLSearchParams(window.location.search).get('id');

  if (!form || !submitBtn || !bugId) return showError('Invalid bug ID');

  // Load bug into form
  try {
    clearError();
    const res = await fetch(`${API_BASE}/${bugId}`);
    if (!res.ok) throw new Error('Failed to fetch bug');
    const bug = await res.json();
    form.title.value = bug.title;
    form.description.value = bug.description;
    form.priority.value = bug.priority;
    form.status.value = bug.status;
  } catch (err) {
    return showError(err.message);
  }

  // Handle form submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    clearError();

    const data = {
      title: form.title.value.trim(),
      description: form.description.value.trim(),
      priority: form.priority.value,
      status: form.status.value,
    };

    const validation = validateBug(data);
    if (validation !== true) return showError(validation);

    try {
      submitBtn.textContent = 'Updating...';
      submitBtn.disabled = true;

      const res = await fetch(`${API_BASE}/${bugId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error((await res.json()).error || 'Failed to update bug');
      window.location.href = 'index.html'; // Redirect to refresh
    } catch (err) {
      showError(err.message);
    } finally {
      submitBtn.textContent = 'Update Bug';
      submitBtn.disabled = false;
    }
  });
}

// Validate bug input
function validateBug(data) {
  if (!data.title) return 'Title is required';
  if (data.title.length > 100) return 'Title must be under 100 characters';
  if (!data.description) return 'Description is required';
  if (data.description.length > 1000) return 'Description must be under 1000 characters';
  return true;
}

// Tooltip functions for description
function showTooltip(element) {
  const tooltip = element.querySelector('.tooltip');
  if (tooltip) {
    tooltip.style.visibility = 'visible';
    tooltip.style.opacity = '1';
  }
}

function hideTooltip(element) {
  const tooltip = element.querySelector('.tooltip');
  if (tooltip) {
    tooltip.style.visibility = 'hidden';
    tooltip.style.opacity = '0';
  }
}

function toggleTooltip(element) {
  const tooltip = element.querySelector('.tooltip');
  if (tooltip) {
    if (tooltip.style.visibility === 'visible') {
      hideTooltip(element);
    } else {
      showTooltip(element);
    }
  }
}

// Initialize correct logic based on current page
document.addEventListener('DOMContentLoaded', () => {
  if (currentPage === 'index.html') loadBugs();
  if (currentPage === 'create.html') initCreateForm();
  if (currentPage === 'edit.html') initEditForm();
});
