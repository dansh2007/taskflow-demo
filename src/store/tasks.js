
import { reactive } from 'vue';
import initialTasks from '../data/tasks';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const allowedCategories = ['study', 'work', 'personal'];

export const taskState = reactive({
  tasks: initialTasks.map((task) => ({
    ...task,
    category: task.category ?? 'study',
  })),
});

function todayString() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function validDate(value) {
  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);

  return (
    !Number.isNaN(date.getTime()) &&
    `${date.getFullYear()}-${String(
      date.getMonth() + 1
    ).padStart(2, '0')}-${String(
      date.getDate()
    ).padStart(2, '0')}` === value
  );
}

function normalizeTaskData(data, originalTask = null) {
  if (!data || typeof data !== 'object') return null;

  const title =
    typeof data.title === 'string'
      ? data.title.trim()
      : '';

  const description =
    typeof data.description === 'string'
      ? data.description.trim()
      : '';

  if (title.length < 3 || title.length > 80) return null;
  if (description.length > 300) return null;

  if (!allowedStatuses.includes(data.status)) return null;
  if (!allowedPriorities.includes(data.priority)) return null;
  if (!allowedCategories.includes(data.category)) return null;

  if (!validDate(data.dueDate)) return null;

  // Нові завдання не можуть мати минулу дату.
  // Під час редагування дозволяємо залишити
  // початкову дату, навіть якщо вона вже минула.
  const keepingOriginalDate =
    originalTask !== null &&
    data.dueDate === originalTask.dueDate;

  if (data.dueDate < todayString() && !keepingOriginalDate) {
    return null;
  }

  return {
    title,
    description,
    status: data.status,
    priority: data.priority,
    category: data.category,
    dueDate: data.dueDate,
  };
}

function normalizeTitle(title) {
  return title.trim().toLocaleLowerCase('uk-UA');
}

export function isTitleTaken(title, excludeId = null) {
  if (typeof title !== 'string') return false;

  const normalizedTitle = normalizeTitle(title);

  return taskState.tasks.some(
    (task) =>
      task.id !== excludeId &&
      normalizeTitle(task.title) === normalizedTitle
  );
}

export function addTask(data) {
  const normalized = normalizeTaskData(data);

  if (!normalized) return null;

  // Перевірка унікальності назви
  if (isTitleTaken(normalized.title)) return null;

  const nextId =
    taskState.tasks.reduce(
      (maxId, task) => Math.max(maxId, task.id),
      0
    ) + 1;

  const newTask = {
    id: nextId,
    ...normalized,
  };

  taskState.tasks.push(newTask);

  return newTask;
}

export function updateTask({ id, ...data }) {
  const task = taskState.tasks.find(
    (item) => item.id === id
  );

  if (!task) return null;

  const normalized = normalizeTaskData(data, task);

  if (!normalized) return null;

  // Під час редагування виключаємо поточне завдання
  if (isTitleTaken(normalized.title, id)) return null;

  Object.assign(task, normalized);

  return task;
}

export function setTaskStatus({ id, status }) {
  if (!allowedStatuses.includes(status)) return;

  const task = taskState.tasks.find(
    (item) => item.id === id
  );

  if (task) task.status = status;
}

export function setTaskPriority({ id, priority }) {
  if (!allowedPriorities.includes(priority)) return;

  const task = taskState.tasks.find(
    (item) => item.id === id
  );

  if (task) task.priority = priority;
}
