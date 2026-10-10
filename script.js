/*
  StudyFlow
  -------------
  Tasks live in the `tasks` array. Every change is saved in
  localStorage so the list is still here after a refresh.

  The script builds task cards with document.createElement and
  textContent, so a title such as "<b>Quiz</b>" is shown as text.
*/

const STORAGE_KEY = "studyPlannerTasks";
const PRIORITIES = ["Low", "Medium", "High"];

const taskForm = document.querySelector("#task-form");
const titleInput = document.querySelector("#task-title");
const subjectInput = document.querySelector("#task-subject");
const dueDateInput = document.querySelector("#task-due-date");
const priorityInput = document.querySelector("#task-priority");
const formError = document.querySelector("#form-error");
const taskList = document.querySelector("#task-list");
const emptyState = document.querySelector("#empty-state");
const emptyTitle = document.querySelector("#empty-title");
const emptyMessage = document.querySelector("#empty-message");
const listSummary = document.querySelector("#list-summary");
const filterButtons = document.querySelectorAll("[data-filter]");
const statTotal = document.querySelector("#stat-total");
const statCompleted = document.querySelector("#stat-completed");
const statPending = document.querySelector("#stat-pending");
const progressFill = document.querySelector("#progress-fill");
const progressLabel = document.querySelector("#progress-label");
const progressBar = document.querySelector("#progress-bar");

let tasks = [];
let activeFilter = "all";

function init() {
  if (!taskForm || !taskList || !emptyState) {
    console.error("StudyFlow could not find the form or task list.");
    return;
  }

  tasks = loadTasks();
  taskForm.addEventListener("submit", addTask);
  titleInput.addEventListener("input", clearErrorWhenTitleExists);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      setFilter(button.dataset.filter);
    });
  });

  render();
}

function loadTasks() {
  try {
    const storedValue = localStorage.getItem(STORAGE_KEY);
    if (!storedValue) {
      return [];
    }

    const parsedValue = JSON.parse(storedValue);
    if (!Array.isArray(parsedValue)) {
      return [];
    }

    return parsedValue.map(normalizeTask).filter((task) => task !== null);
  } catch (error) {
    console.error("Could not read saved tasks.", error);
    return [];
  }
}

function saveTasks() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
    return true;
  } catch (error) {
    console.error("Could not save tasks.", error);
    return false;
  }
}

function normalizeTask(task) {
  if (!task || typeof task !== "object") {
    return null;
  }

  if (typeof task.title !== "string" || task.title.trim() === "") {
    return null;
  }

  const priority = PRIORITIES.includes(task.priority) ? task.priority : "Medium";
  const subject =
    typeof task.subject === "string" && task.subject.trim() !== ""
      ? task.subject.trim()
      : "General";

  return {
    id: typeof task.id === "string" && task.id !== "" ? task.id : createId(),
    title: task.title.trim(),
    subject,
    dueDate: typeof task.dueDate === "string" ? task.dueDate : "",
    priority,
    completed: Boolean(task.completed),
  };
}

function addTask(event) {
  event.preventDefault();

  const title = titleInput.value.trim();
  const subject = subjectInput.value.trim();
  const dueDate = dueDateInput.value;
  const priority = priorityInput.value;

  if (title === "") {
    showError("Please enter a task title.", titleInput);
    titleInput.focus();
    return;
  }

  if (!PRIORITIES.includes(priority)) {
    showError("Please choose Low, Medium, or High priority.", priorityInput);
    priorityInput.focus();
    return;
  }

  if (!isValidDueDate(dueDate)) {
    showError("Please enter a valid due date, or leave it blank.", dueDateInput);
    dueDateInput.focus();
    return;
  }

  tasks.unshift({
    id: createId(),
    title,
    subject: subject || "General",
    dueDate,
    priority,
    completed: false,
  });

  const saved = saveTasks();
  taskForm.reset();
  clearError();
  render();
  titleInput.focus();

  if (!saved) {
    showError("Tasks could not be saved in this browser.");
  }
}

function toggleTask(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) {
    return;
  }

  task.completed = !task.completed;
  saveTasks();
  render();
}

function deleteTask(taskId) {
  const taskExists = tasks.some((item) => item.id === taskId);
  if (!taskExists) {
    return;
  }

  tasks = tasks.filter((item) => item.id !== taskId);
  saveTasks();
  render();
}

function setFilter(filterName) {
  if (filterName !== "all" && filterName !== "pending" && filterName !== "completed") {
    return;
  }

  activeFilter = filterName;
  render();
}

function getVisibleTasks() {
  if (activeFilter === "pending") {
    return tasks.filter((task) => !task.completed);
  }

  if (activeFilter === "completed") {
    return tasks.filter((task) => task.completed);
  }

  return tasks;
}

function render() {
  renderStats();
  renderFilters();
  renderTaskList();
}

function renderStats() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.completed).length;
  const pending = total - completed;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);
  const progressText =
    total === 0 ? "0% complete" : `${percent}% complete (${completed} of ${total})`;

  statTotal.textContent = String(total);
  statCompleted.textContent = String(completed);
  statPending.textContent = String(pending);
  progressFill.style.width = `${percent}%`;
  progressLabel.textContent = progressText;
  progressBar.setAttribute("aria-valuenow", String(percent));
  progressBar.setAttribute("aria-valuetext", progressText);
}

function renderFilters() {
  const completed = tasks.filter((task) => task.completed).length;
  const counts = {
    all: tasks.length,
    pending: tasks.length - completed,
    completed,
  };
  const summaries = {
    all: "Showing every task.",
    pending: "Showing tasks that are not done yet.",
    completed: "Showing tasks you have finished.",
  };

  filterButtons.forEach((button) => {
    const filterName = button.dataset.filter;
    const label = button.dataset.label || "Tasks";
    const isSelected = filterName === activeFilter;
    button.textContent = `${label} (${counts[filterName] ?? 0})`;
    button.classList.toggle("is-active", isSelected);
    button.setAttribute("aria-pressed", String(isSelected));
  });

  listSummary.textContent = summaries[activeFilter];
}

function renderTaskList() {
  const visibleTasks = getVisibleTasks();
  taskList.replaceChildren();

  if (visibleTasks.length === 0) {
    const emptyCopy = getEmptyCopy();
    emptyTitle.textContent = emptyCopy.title;
    emptyMessage.textContent = emptyCopy.message;
    emptyState.hidden = false;
    return;
  }

  emptyState.hidden = true;
  visibleTasks.forEach((task) => {
    taskList.appendChild(createTaskCard(task));
  });
}

function getEmptyCopy() {
  if (tasks.length === 0) {
    return {
      title: "No study tasks yet",
      message: "Add a title, subject, due date, and priority to get started.",
    };
  }

  if (activeFilter === "pending") {
    return {
      title: "No pending tasks",
      message: "Every task on your list is complete.",
    };
  }

  if (activeFilter === "completed") {
    return {
      title: "No completed tasks",
      message: "Mark a task complete when you finish studying.",
    };
  }

  return {
    title: "No tasks to show",
    message: "Add a study task to see it here.",
  };
}

function createTaskCard(task) {
  const item = document.createElement("li");
  item.className = `task-card ${priorityClassName(task.priority)}`;
  if (task.completed) {
    item.classList.add("is-complete");
  }

  const top = document.createElement("div");
  top.className = "task-top";

  const title = document.createElement("h4");
  title.className = "task-title";
  title.textContent = task.title;

  const priority = document.createElement("span");
  priority.className = `priority-badge ${badgeClassName(task.priority)}`;
  priority.textContent = task.priority;

  top.append(title, priority);

  const meta = document.createElement("p");
  meta.className = "task-meta";

  const subject = document.createElement("span");
  subject.textContent = task.subject;

  const due = document.createElement("time");
  if (task.dueDate) {
    due.dateTime = task.dueDate;
  }
  due.textContent = formatDueDate(task.dueDate);

  meta.append(subject, document.createTextNode(" · "), due);

  if (isOverdue(task)) {
    const overdue = document.createElement("span");
    overdue.className = "overdue";
    overdue.textContent = "Overdue";
    meta.append(document.createTextNode(" · "), overdue);
  }

  const status = document.createElement("p");
  status.className = task.completed ? "status status-complete" : "status status-pending";
  status.textContent = task.completed ? "Completed" : "Pending";

  const actions = document.createElement("div");
  actions.className = "task-actions";

  const toggleButton = document.createElement("button");
  toggleButton.type = "button";
  toggleButton.className = "button button-secondary";
  toggleButton.textContent = task.completed ? "Mark pending" : "Mark complete";
  toggleButton.setAttribute(
    "aria-label",
    task.completed
      ? `Mark ${task.title} as pending`
      : `Mark ${task.title} as complete`
  );
  toggleButton.addEventListener("click", () => toggleTask(task.id));

  const deleteButton = document.createElement("button");
  deleteButton.type = "button";
  deleteButton.className = "button button-danger";
  deleteButton.textContent = "Delete";
  deleteButton.setAttribute("aria-label", `Delete ${task.title}`);
  deleteButton.addEventListener("click", () => deleteTask(task.id));

  actions.append(toggleButton, deleteButton);
  item.append(top, meta, status, actions);
  return item;
}

function priorityClassName(priority) {
  if (priority === "Low") {
    return "task-priority-low";
  }
  if (priority === "High") {
    return "task-priority-high";
  }
  return "task-priority-medium";
}

function badgeClassName(priority) {
  if (priority === "Low") {
    return "priority-low";
  }
  if (priority === "High") {
    return "priority-high";
  }
  return "priority-medium";
}

function formatDueDate(dueDate) {
  if (!dueDate) {
    return "No due date";
  }

  const date = new Date(`${dueDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return "No due date";
  }

  const formatted = date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `Due ${formatted}`;
}

function isOverdue(task) {
  if (task.completed || !task.dueDate) {
    return false;
  }

  const due = new Date(`${task.dueDate}T00:00:00`);
  if (Number.isNaN(due.getTime())) {
    return false;
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due < today;
}

function isValidDueDate(value) {
  if (!value) {
    return true;
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const date = new Date(`${value}T00:00:00`);
  return !Number.isNaN(date.getTime());
}

function createId() {
  if (window.crypto && typeof window.crypto.randomUUID === "function") {
    return window.crypto.randomUUID();
  }

  return `task-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
}

function showError(message, field) {
  formError.hidden = false;
  formError.textContent = message;
  clearInvalidFields();
  if (field) {
    field.setAttribute("aria-invalid", "true");
  }
}

function clearError() {
  formError.hidden = true;
  formError.textContent = "";
  clearInvalidFields();
}

function clearInvalidFields() {
  titleInput.removeAttribute("aria-invalid");
  subjectInput.removeAttribute("aria-invalid");
  dueDateInput.removeAttribute("aria-invalid");
  priorityInput.removeAttribute("aria-invalid");
}

function clearErrorWhenTitleExists() {
  if (titleInput.value.trim() !== "") {
    clearError();
  }
}

init();
