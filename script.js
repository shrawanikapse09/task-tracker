// ==========================================================================
// TASKFLOW SAAS DASHBOARD JAVASCRIPT
// Production-grade, beginner-friendly script managing tasks, state & storage.
// ==========================================================================

// --------------------------------------------------------------------------
// 1. DOM ELEMENT REFERENCES
// --------------------------------------------------------------------------
// Sidebar & Navigation
const sidebar = document.getElementById('sidebar');
const sidebarToggle = document.getElementById('sidebarToggle');
const sidebarOverlay = document.getElementById('sidebarOverlay');
const navLinks = document.querySelectorAll('.nav-link');
const navCountMyTasks = document.getElementById('navCountMyTasks');
const navCountToday = document.getElementById('navCountToday');
const navCountUpcoming = document.getElementById('navCountUpcoming');
const navCountCompleted = document.getElementById('navCountCompleted');

// Header Elements
const searchInput = document.getElementById('searchInput');
const currentDateEl = document.getElementById('currentDate');
const openAddModalBtn = document.getElementById('openAddModalBtn');
const notificationsBtn = document.querySelector('button[aria-label="Notifications"]');

// View Header
const viewTitle = document.getElementById('viewTitle');
const viewSubtitle = document.getElementById('viewSubtitle');

// KPI Stat Cards
const statTotal = document.getElementById('statTotal');
const statPending = document.getElementById('statPending');
const statCompleted = document.getElementById('statCompleted');
const statCompletionRate = document.getElementById('statCompletionRate');

// Overview Section Elements
const overviewSection = document.getElementById('overviewSection');
const taskManagementSection = document.getElementById('taskManagementSection');
const statHighCount = document.getElementById('statHighCount');
const statMediumCount = document.getElementById('statMediumCount');
const statLowCount = document.getElementById('statLowCount');

// Inline Quick-Add Form
const inlineTaskForm = document.getElementById('inlineTaskForm');
const inlineTaskInput = document.getElementById('inlineTaskInput');
const inlineDueDate = document.getElementById('inlineDueDate');
const inlinePriority = document.getElementById('inlinePriority');

// Tasks Toolbar & List
const filterTabs = document.querySelectorAll('.filter-tab');
const priorityFilterSelect = document.getElementById('priorityFilterSelect');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');
const taskList = document.getElementById('taskList');
const emptyState = document.getElementById('emptyState');
const emptyStateTitle = document.getElementById('emptyStateTitle');
const emptyStateDesc = document.getElementById('emptyStateDesc');
const emptyStateAction = document.getElementById('emptyStateAction');

// Edit Task Modal Elements
const editModal = document.getElementById('editModal');
const modalBackdrop = document.getElementById('modalBackdrop');
const closeModalBtn = document.getElementById('closeModalBtn');
const cancelModalBtn = document.getElementById('cancelModalBtn');
const editTaskForm = document.getElementById('editTaskForm');
const editTaskId = document.getElementById('editTaskId');
const editTaskText = document.getElementById('editTaskText');
const editDueDate = document.getElementById('editDueDate');
const editPriority = document.getElementById('editPriority');
const modalTitle = document.getElementById('modalTitle');

// Delete Confirmation Modal Elements
const deleteModal = document.getElementById('deleteModal');
const deleteModalBackdrop = document.getElementById('deleteModalBackdrop');
const closeDeleteModalBtn = document.getElementById('closeDeleteModalBtn');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');
const deleteTaskName = document.getElementById('deleteTaskName');

// Toast Notification Container
const toastContainer = document.getElementById('toastContainer');

// --------------------------------------------------------------------------
// 2. APPLICATION STATE
// --------------------------------------------------------------------------
let tasks = [];
let currentView = 'my-tasks';        // 'overview' | 'my-tasks' | 'today' | 'upcoming' | 'completed'
let currentStatusFilter = 'all';     // 'all' | 'pending' | 'completed'
let currentPriorityFilter = 'all';   // 'all' | 'high' | 'medium' | 'low'
let searchQuery = '';
let taskPendingDeletionId = null;

// --------------------------------------------------------------------------
// 3. DATA STORAGE (localStorage with safe fallback & validation)
// --------------------------------------------------------------------------
function loadTasks() {
  const saved = localStorage.getItem('taskflow_saas_tasks');
  if (saved) {
    try {
      const parsed = JSON.parse(saved);
      // Validate that parsed data is indeed an array
      if (Array.isArray(parsed)) {
        // Sanitize objects to ensure all expected properties exist safely
        tasks = parsed.filter(item => item && typeof item === 'object').map(item => ({
          id: item.id || Date.now() + Math.random(),
          text: String(item.text || 'Untitled Task'),
          completed: Boolean(item.completed),
          dueDate: typeof item.dueDate === 'string' ? item.dueDate : '',
          priority: ['high', 'medium', 'low'].includes(item.priority) ? item.priority : 'medium',
          createdAt: item.createdAt || Date.now()
        }));
      } else {
        console.warn('Stored tasks was not an array. Resetting.');
        tasks = [];
      }
    } catch (e) {
      console.error('Failed to parse tasks from localStorage. Recovering gracefully:', e);
      tasks = [];
    }
  } else {
    // Initial sample seed tasks if opening for the first time
    const today = getTodayString();
    const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
    const nextWeek = new Date(Date.now() + 86400000 * 5).toISOString().split('T')[0];

    tasks = [
      {
        id: 1,
        text: "Review Q4 product roadmap and sprint goals",
        completed: false,
        dueDate: today,
        priority: "high",
        createdAt: Date.now() - 3600000
      },
      {
        id: 2,
        text: "Update design tokens in Figma component library",
        completed: false,
        dueDate: tomorrow,
        priority: "medium",
        createdAt: Date.now() - 7200000
      },
      {
        id: 3,
        text: "Prepare weekly executive analytics deck",
        completed: true,
        dueDate: today,
        priority: "high",
        createdAt: Date.now() - 14400000
      },
      {
        id: 4,
        text: "Schedule quarterly customer feedback interviews",
        completed: false,
        dueDate: nextWeek,
        priority: "low",
        createdAt: Date.now() - 28800000
      }
    ];
    saveTasks();
  }
}

function saveTasks() {
  try {
    localStorage.setItem('taskflow_saas_tasks', JSON.stringify(tasks));
  } catch (err) {
    console.error('Failed to save tasks to localStorage:', err);
    showToast('Failed to save changes to local storage', 'info');
  }
}

// --------------------------------------------------------------------------
// 4. USER EXPERIENCE: TOAST NOTIFICATIONS
// --------------------------------------------------------------------------
function showToast(message, type = 'success') {
  if (!toastContainer) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type === 'info' ? 'toast-info' : ''}`;

  const iconSvg = type === 'info'
    ? `<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
         <circle cx="12" cy="12" r="10"></circle>
         <line x1="12" y1="16" x2="12" y2="12"></line>
         <line x1="12" y1="8" x2="12.01" y2="8"></line>
       </svg>`
    : `<svg class="toast-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
         <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
         <polyline points="22 4 12 14.01 9 11.01"></polyline>
       </svg>`;

  const textSpan = document.createElement('span');
  textSpan.textContent = String(message);

  toast.innerHTML = iconSvg;
  toast.appendChild(textSpan);
  toastContainer.appendChild(toast);

  // Auto remove after 3 seconds with smooth transition
  setTimeout(() => {
    toast.classList.add('toast-fadeout');
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
    }, 200);
  }, 2800);
}

// --------------------------------------------------------------------------
// 5. DATE HELPER FUNCTIONS
// --------------------------------------------------------------------------
function getTodayString() {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return 'No due date';

  const todayStr = getTodayString();
  const taskDate = new Date(dateStr + 'T00:00:00');
  if (isNaN(taskDate.getTime())) return 'No due date';

  const todayDate = new Date(todayStr + 'T00:00:00');
  const diffDays = Math.round((taskDate - todayDate) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';

  const options = { month: 'short', day: 'numeric' };
  return taskDate.toLocaleDateString('en-US', options);
}

function isOverdue(dateStr, completed) {
  if (!dateStr || completed) return false;
  return dateStr < getTodayString();
}

function updateHeaderDate() {
  if (currentDateEl) {
    const today = new Date();
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    currentDateEl.textContent = today.toLocaleDateString('en-US', options);
  }
}

// --------------------------------------------------------------------------
// 6. METRICS & COUNTERS UPDATE (Calculates stats automatically)
// --------------------------------------------------------------------------
function updateMetrics() {
  const total = tasks.length;
  const pending = tasks.filter(t => !t.completed).length;
  const completed = total - pending;
  const completionRate = total === 0 ? 0 : Math.round((completed / total) * 100);

  // Update KPI summary stat cards
  if (statTotal) statTotal.textContent = total;
  if (statPending) statPending.textContent = pending;
  if (statCompleted) statCompleted.textContent = completed;
  if (statCompletionRate) statCompletionRate.textContent = `${completionRate}% completion rate`;

  // Update Sidebar Navigation Counters
  const todayStr = getTodayString();
  const todayCount = tasks.filter(t => t.dueDate === todayStr && !t.completed).length;
  const upcomingCount = tasks.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed).length;

  if (navCountMyTasks) navCountMyTasks.textContent = pending;
  if (navCountToday) navCountToday.textContent = todayCount;
  if (navCountUpcoming) navCountUpcoming.textContent = upcomingCount;
  if (navCountCompleted) navCountCompleted.textContent = completed;

  // Update Overview breakdown counts
  const highPending = tasks.filter(t => !t.completed && t.priority === 'high').length;
  const medPending = tasks.filter(t => !t.completed && t.priority === 'medium').length;
  const lowPending = tasks.filter(t => !t.completed && t.priority === 'low').length;

  if (statHighCount) statHighCount.textContent = highPending;
  if (statMediumCount) statMediumCount.textContent = medPending;
  if (statLowCount) statLowCount.textContent = lowPending;

  // Update Clear Completed button enabled/disabled state
  if (clearCompletedBtn) {
    clearCompletedBtn.disabled = completed === 0;
  }
}

// --------------------------------------------------------------------------
// 7. TASK CRUD OPERATIONS
// --------------------------------------------------------------------------

// Add Task
function addTask(text, dueDateVal = '', priorityVal = 'medium') {
  const trimmed = text.trim();
  if (!trimmed) return;

  const newTask = {
    id: Date.now(),
    text: trimmed,
    completed: false,
    dueDate: dueDateVal || '',
    priority: priorityVal || 'medium',
    createdAt: Date.now()
  };

  tasks.unshift(newTask);
  saveTasks();
  render();
  showToast('Task added successfully');
}

// Toggle Task Completion Status
function toggleTask(id) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.completed = !task.completed;
    saveTasks();
    render();
    if (task.completed) {
      showToast('Task marked as completed');
    }
  }
}

// Update Existing Task
function updateTask(id, text, dueDateVal, priorityVal) {
  const task = tasks.find(t => t.id === id);
  if (task) {
    task.text = text.trim();
    task.dueDate = dueDateVal || '';
    task.priority = priorityVal || 'medium';
    saveTasks();
    render();
    showToast('Task updated successfully');
  }
}

// Confirm and Execute Task Deletion
function requestDeleteTask(id) {
  const task = tasks.find(t => t.id === id);
  if (!task) return;

  taskPendingDeletionId = id;
  if (deleteTaskName) {
    deleteTaskName.textContent = `"${task.text}"`;
  }

  // Open confirmation modal
  if (deleteModal) {
    deleteModal.classList.add('active');
    deleteModal.setAttribute('aria-hidden', 'false');
  }
}

function closeDeleteModal() {
  if (deleteModal) {
    deleteModal.classList.remove('active');
    deleteModal.setAttribute('aria-hidden', 'true');
  }
  taskPendingDeletionId = null;
}

function executeDeleteTask() {
  if (taskPendingDeletionId !== null) {
    tasks = tasks.filter(t => t.id !== taskPendingDeletionId);
    saveTasks();
    render();
    closeDeleteModal();
    showToast('Task deleted successfully');
  }
}

// Clear all completed tasks
function clearCompletedTasks() {
  const completedCount = tasks.filter(t => t.completed).length;
  if (completedCount === 0) return;

  tasks = tasks.filter(t => !t.completed);
  saveTasks();
  render();
  showToast(`Cleared ${completedCount} completed ${completedCount === 1 ? 'task' : 'tasks'}`);
}

// --------------------------------------------------------------------------
// 8. RENDER TASKS & CONTEXTUAL EMPTY STATES
// --------------------------------------------------------------------------
function render() {
  // Update view headings according to sidebar selection
  const viewHeadings = {
    'overview': { title: 'Workspace Overview', subtitle: 'Executive summary and task distribution.' },
    'my-tasks': { title: 'My Tasks', subtitle: 'Track, prioritize, and accomplish your work efficiently.' },
    'today': { title: 'Due Today', subtitle: 'Tasks scheduled for completion today.' },
    'upcoming': { title: 'Upcoming Tasks', subtitle: 'Tasks scheduled for future dates.' },
    'completed': { title: 'Completed Tasks', subtitle: 'Archive of finished and resolved tasks.' }
  };

  const headerInfo = viewHeadings[currentView] || viewHeadings['my-tasks'];
  viewTitle.textContent = headerInfo.title;
  viewSubtitle.textContent = headerInfo.subtitle;

  // Toggle sections: Overview vs Task Management list
  if (currentView === 'overview') {
    overviewSection.style.display = 'block';
  } else {
    overviewSection.style.display = 'none';
  }

  // Filter Tasks by View, Status Filter, Priority, and Search Query
  const todayStr = getTodayString();
  let filtered = [...tasks];

  // 1. Sidebar View Filter
  if (currentView === 'today') {
    filtered = filtered.filter(t => t.dueDate === todayStr);
  } else if (currentView === 'upcoming') {
    filtered = filtered.filter(t => t.dueDate && t.dueDate > todayStr && !t.completed);
  } else if (currentView === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // 2. Toolbar Status Filter (All, Pending, Completed)
  if (currentStatusFilter === 'pending') {
    filtered = filtered.filter(t => !t.completed);
  } else if (currentStatusFilter === 'completed') {
    filtered = filtered.filter(t => t.completed);
  }

  // 3. Toolbar Priority Filter (All, High, Medium, Low)
  if (currentPriorityFilter !== 'all') {
    filtered = filtered.filter(t => t.priority === currentPriorityFilter);
  }

  // 4. Live Search Query
  if (searchQuery.trim() !== '') {
    const q = searchQuery.toLowerCase().trim();
    filtered = filtered.filter(t => t.text.toLowerCase().includes(q));
  }

  // Render Table Rows
  taskList.innerHTML = '';

  if (filtered.length === 0) {
    emptyState.classList.add('visible');
    emptyStateAction.innerHTML = '';

    // Useful, contextual messages when no tasks exist
    if (searchQuery.trim() !== '') {
      emptyStateTitle.textContent = 'No matching tasks found';
      emptyStateDesc.textContent = `No tasks match your search for "${searchQuery}". Check for typos or clear your search query.`;
      
      const clearSearchBtn = document.createElement('button');
      clearSearchBtn.className = 'btn btn-secondary empty-action-btn';
      clearSearchBtn.textContent = 'Clear Search';
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        render();
        searchInput.focus();
      });
      emptyStateAction.appendChild(clearSearchBtn);

    } else if (currentView === 'today') {
      emptyStateTitle.textContent = 'No tasks due today';
      emptyStateDesc.textContent = 'You have no tasks scheduled for today. Great job staying on track!';
    } else if (currentView === 'upcoming') {
      emptyStateTitle.textContent = 'No upcoming tasks';
      emptyStateDesc.textContent = 'Plan ahead by setting future due dates on your tasks.';
    } else if (currentView === 'completed') {
      emptyStateTitle.textContent = 'No completed tasks';
      emptyStateDesc.textContent = 'Finished tasks will be automatically archived here.';
    } else if (currentStatusFilter === 'pending') {
      emptyStateTitle.textContent = 'All caught up!';
      emptyStateDesc.textContent = 'You have zero pending tasks. Take a break or add a new task above.';
    } else if (tasks.length === 0) {
      emptyStateTitle.textContent = 'Your task list is empty';
      emptyStateDesc.textContent = 'Get started by creating your first task using the input bar above.';
    } else {
      emptyStateTitle.textContent = 'No tasks found';
      emptyStateDesc.textContent = 'There are no tasks matching your selected filters.';
    }

  } else {
    emptyState.classList.remove('visible');

    filtered.forEach(task => {
      const row = document.createElement('li');
      row.className = `task-row ${task.completed ? 'completed' : ''}`;

      // Column 1: Checkbox & Task Title
      const titleCol = document.createElement('div');
      titleCol.className = 'row-title-col';

      // Circular Custom Checkbox
      const checkbox = document.createElement('div');
      checkbox.className = 'custom-checkbox';
      checkbox.setAttribute('role', 'checkbox');
      checkbox.setAttribute('aria-checked', task.completed ? 'true' : 'false');
      checkbox.setAttribute('tabindex', '0');
      checkbox.setAttribute('title', task.completed ? 'Mark as pending' : 'Mark as completed');
      checkbox.innerHTML = `
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"></polyline>
        </svg>
      `;

      checkbox.addEventListener('click', (e) => {
        e.stopPropagation();
        toggleTask(task.id);
      });

      checkbox.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          toggleTask(task.id);
        }
      });

      // Text Title
      const taskText = document.createElement('span');
      taskText.className = 'task-text';
      taskText.textContent = task.text;
      taskText.title = "Click to toggle completion";
      taskText.addEventListener('click', () => {
        toggleTask(task.id);
      });

      titleCol.appendChild(checkbox);
      titleCol.appendChild(taskText);

      // Column 2: Due Date (Clearly distinguishes overdue tasks)
      const dateCol = document.createElement('div');
      const overdue = isOverdue(task.dueDate, task.completed);
      dateCol.className = `row-date-col ${overdue ? 'overdue' : ''}`;

      const dateIcon = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      `;

      if (overdue) {
        dateCol.innerHTML = `
          <span class="overdue-tag">Overdue</span>
          <span>${formatDisplayDate(task.dueDate)}</span>
        `;
        dateCol.title = `Task was due on ${task.dueDate} and is overdue`;
      } else {
        dateCol.innerHTML = `${dateIcon} <span>${formatDisplayDate(task.dueDate)}</span>`;
      }

      // Column 3: Priority Badge
      const priorityCol = document.createElement('div');
      priorityCol.className = 'row-priority-col';
      const p = task.priority || 'medium';
      priorityCol.innerHTML = `<span class="priority-badge ${p}">${p}</span>`;

      // Column 4: Actions (Edit & Delete)
      const actionsCol = document.createElement('div');
      actionsCol.className = 'row-actions-col';

      // Edit Button
      const editBtn = document.createElement('button');
      editBtn.type = 'button';
      editBtn.className = 'row-action-btn edit-btn';
      editBtn.setAttribute('aria-label', `Edit "${task.text}"`);
      editBtn.title = "Edit task";
      editBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path>
        </svg>
      `;
      editBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        openEditModal(task);
      });

      // Delete Button (Opens confirmation dialog)
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'row-action-btn delete-btn';
      deleteBtn.setAttribute('aria-label', `Delete "${task.text}"`);
      deleteBtn.title = "Delete task";
      deleteBtn.innerHTML = `
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        requestDeleteTask(task.id);
      });

      actionsCol.appendChild(editBtn);
      actionsCol.appendChild(deleteBtn);

      // Assemble Row
      row.appendChild(titleCol);
      row.appendChild(dateCol);
      row.appendChild(priorityCol);
      row.appendChild(actionsCol);
      taskList.appendChild(row);
    });
  }

  // Update metrics automatically
  updateMetrics();
}

// --------------------------------------------------------------------------
// 9. MODAL HANDLING (Add, Edit, and Delete Confirmation)
// --------------------------------------------------------------------------
function openEditModal(task = null) {
  if (task) {
    modalTitle.textContent = 'Edit Task';
    editTaskId.value = task.id;
    editTaskText.value = task.text;
    editDueDate.value = task.dueDate || '';
    editPriority.value = task.priority || 'medium';
  } else {
    // New Task mode
    modalTitle.textContent = 'Add New Task';
    editTaskId.value = '';
    editTaskText.value = '';
    editDueDate.value = getTodayString();
    editPriority.value = 'medium';
  }

  editModal.classList.add('active');
  editModal.setAttribute('aria-hidden', 'false');
  setTimeout(() => editTaskText.focus(), 50);
}

function closeEditModal() {
  editModal.classList.remove('active');
  editModal.setAttribute('aria-hidden', 'true');
  editTaskForm.reset();
}

// --------------------------------------------------------------------------
// 10. EVENT LISTENERS
// --------------------------------------------------------------------------

// Inline Quick-Add Form Submission
inlineTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const text = inlineTaskInput.value;
  const date = inlineDueDate.value;
  const prio = inlinePriority.value;

  addTask(text, date, prio);

  inlineTaskInput.value = '';
  inlineDueDate.value = '';
  inlinePriority.value = 'medium';
  inlineTaskInput.focus();
});

// Top Header "+ Add Task" Button
openAddModalBtn.addEventListener('click', () => {
  openEditModal(); // Opens in new task mode
});

// Edit Modal Close & Cancel
closeModalBtn.addEventListener('click', closeEditModal);
cancelModalBtn.addEventListener('click', closeEditModal);
modalBackdrop.addEventListener('click', closeEditModal);

// Delete Modal Close & Cancel & Confirm
closeDeleteModalBtn.addEventListener('click', closeDeleteModal);
cancelDeleteBtn.addEventListener('click', closeDeleteModal);
deleteModalBackdrop.addEventListener('click', closeDeleteModal);
confirmDeleteBtn.addEventListener('click', executeDeleteTask);

// Notifications Button Feedback
if (notificationsBtn) {
  notificationsBtn.addEventListener('click', () => {
    showToast("You're all caught up! No unread notifications.", 'info');
  });
}

// Modal Form Submission (Handles both Add & Edit)
editTaskForm.addEventListener('submit', (e) => {
  e.preventDefault();
  const id = editTaskId.value ? parseInt(editTaskId.value, 10) : null;
  const text = editTaskText.value;
  const date = editDueDate.value;
  const prio = editPriority.value;

  if (id) {
    updateTask(id, text, date, prio);
  } else {
    addTask(text, date, prio);
  }

  closeEditModal();
});

// Sidebar Navigation
navLinks.forEach(link => {
  link.addEventListener('click', () => {
    navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');

    currentView = link.getAttribute('data-view');

    // Reset status filter tab to 'all' so views don't produce conflicting empty sets
    currentStatusFilter = 'all';
    filterTabs.forEach(t => {
      t.classList.toggle('active', t.getAttribute('data-status-filter') === 'all');
    });

    // Close mobile drawer if open
    sidebar.classList.remove('open');
    sidebarOverlay.classList.remove('active');

    render();
  });
});

// Mobile Sidebar Toggle & Overlay
sidebarToggle.addEventListener('click', () => {
  sidebar.classList.toggle('open');
  sidebarOverlay.classList.toggle('active');
});

sidebarOverlay.addEventListener('click', () => {
  sidebar.classList.remove('open');
  sidebarOverlay.classList.remove('active');
});

// Status Filter Tabs (All Tasks, Pending, Completed)
filterTabs.forEach(tab => {
  tab.addEventListener('click', () => {
    filterTabs.forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    currentStatusFilter = tab.getAttribute('data-status-filter');
    render();
  });
});

// Priority Filter Dropdown
priorityFilterSelect.addEventListener('change', (e) => {
  currentPriorityFilter = e.target.value;
  render();
});

// Clear Completed Button
clearCompletedBtn.addEventListener('click', () => {
  clearCompletedTasks();
});

// Live Search Input
searchInput.addEventListener('input', (e) => {
  searchQuery = e.target.value;
  render();
});

// Keyboard Shortcuts:
// 1. '/' focuses search input (when not typing in another input)
// 2. 'Escape' closes any open modal dialog
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    if (editModal.classList.contains('active')) {
      closeEditModal();
    }
    if (deleteModal.classList.contains('active')) {
      closeDeleteModal();
    }
  }

  const tag = e.target.tagName.toLowerCase();
  if (tag !== 'input' && tag !== 'textarea' && tag !== 'select') {
    if (e.key === '/') {
      e.preventDefault();
      searchInput.focus();
    }
  }
});

// --------------------------------------------------------------------------
// 11. APPLICATION INITIALIZATION
// --------------------------------------------------------------------------
function init() {
  updateHeaderDate();
  loadTasks();
  render();
}

// Start the application
init();
