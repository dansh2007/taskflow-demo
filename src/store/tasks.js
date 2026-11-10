
import { defineStore } from 'pinia';
import initialTasks from '../data/tasks';
import { useProjectsStore } from './projects';

const allowedStatuses = ['todo', 'progress', 'done'];
const allowedPriorities = ['low', 'medium', 'high'];
const allowedCategories = ['study', 'work', 'personal'];

const priorityWeight = {
  high: 3,
  medium: 2,
  low: 1,
};

const statusWeight = {
  progress: 0,
  todo: 1,
  done: 2,
};

function todayString() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

function validDate(value) {
  if (value === '') return true;

  if (
    typeof value !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value)
  ) {
    return false;
  }

  const date = new Date(`${value}T12:00:00`);

  if (Number.isNaN(date.getTime())) {
    return false;
  }

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-') === value;
}

function normalizeTitle(title) {
  return String(title ?? '')
    .trim()
    .toLocaleLowerCase('uk-UA');
}

function normalizeTaskData(values, projects, originalTask = null) {
  if (!values || typeof values !== 'object') {
    return null;
  }

  const title = String(values.title ?? '').trim();
  const description = String(values.description ?? '').trim();

  const status = values.status ?? 'todo';
  const priority = values.priority ?? 'medium';

  const category =
    values.category ?? originalTask?.category ?? 'study';

  const dueDate = String(values.dueDate ?? '');

  const requestedProject = String(
    values.projectId ?? originalTask?.projectId ?? 'general'
  );

  const projectId = projects.some(
    (project) => project.id === requestedProject
  )
    ? requestedProject
    : 'general';

  if (title.length < 3 || title.length > 80) {
    return null;
  }

  if (description.length > 500) {
    return null;
  }

  if (!allowedStatuses.includes(status)) {
    return null;
  }

  if (!allowedPriorities.includes(priority)) {
    return null;
  }

  if (!allowedCategories.includes(category)) {
    return null;
  }

  if (!validDate(dueDate)) {
    return null;
  }

  const keepingOriginalDate =
    originalTask !== null &&
    dueDate === originalTask.dueDate;

  if (
    dueDate &&
    dueDate < todayString() &&
    !keepingOriginalDate
  ) {
    return null;
  }

  return {
    title,
    description,
    status,
    priority,
    category,
    dueDate,
    projectId,
  };
}

export const useTasksStore = defineStore('tasks', {
  state: () => ({
    tasks: initialTasks.map((task) => ({
      ...task,
      category: task.category ?? 'study',
      projectId: task.projectId ?? 'general',
    })),

    searchText: '',
    selectedStatus: 'all',
    selectedPriority: 'all',
    selectedProject: 'all',
    sortOrder: 'newest',
    unfinishedOnly: false,

    // Додаткове завдання № 5
    undatedOnly: false,
  }),

  getters: {
    totalTasks: (state) => state.tasks.length,

    completedTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'done'
      ).length,

    progressTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'progress'
      ).length,

    plannedTasks: (state) =>
      state.tasks.filter(
        (task) => task.status === 'todo'
      ).length,

    activeTasks: (state) =>
      state.tasks
        .filter((task) => task.status !== 'done')
        .sort((a, b) =>
          priorityWeight[b.priority] -
            priorityWeight[a.priority] ||
          b.id - a.id
        )
        .slice(0, 3),

    // Пошук і комбінована фільтрація
    visibleTasks: (state) => {
      const term = state.searchText
        .trim()
        .toLocaleLowerCase('uk-UA');

      const filtered = state.tasks.filter((task) => {
        const text =
          `${task.title} ${task.description ?? ''}`
            .toLocaleLowerCase('uk-UA');

        const matchesText =
          !term || text.includes(term);

        const matchesStatus =
          state.selectedStatus === 'all' ||
          task.status === state.selectedStatus;

        const matchesPriority =
          state.selectedPriority === 'all' ||
          task.priority === state.selectedPriority;

        const matchesProject =
          state.selectedProject === 'all' ||
          task.projectId === state.selectedProject;

        const matchesUnfinished =
          !state.unfinishedOnly ||
          task.status !== 'done';

        // Додаткове завдання № 5
        const matchesUndated =
          !state.undatedOnly ||
          !task.dueDate;

        return (
          matchesText &&
          matchesStatus &&
          matchesPriority &&
          matchesProject &&
          matchesUnfinished &&
          matchesUndated
        );
      });

      return filtered.sort((a, b) => {
        if (state.sortOrder === 'title') {
          return (
            a.title.localeCompare(b.title, 'uk-UA') ||
            a.id - b.id
          );
        }

        if (state.sortOrder === 'priority') {
          return (
            priorityWeight[b.priority] -
              priorityWeight[a.priority] ||
            b.id - a.id
          );
        }

        if (
          state.sortOrder === 'dueDate' ||
          state.sortOrder === 'dueDateDesc'
        ) {
          if (!a.dueDate && !b.dueDate) {
            return b.id - a.id;
          }

          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;

          const comparison =
            a.dueDate.localeCompare(b.dueDate);

          return (
            (state.sortOrder === 'dueDateDesc'
              ? -comparison
              : comparison) ||
            b.id - a.id
          );
        }

        if (state.sortOrder === 'status') {
          return (
            statusWeight[a.status] -
              statusWeight[b.status] ||
            b.id - a.id
          );
        }

        return b.id - a.id;
      });
    },

    // Відсоток виконання видимих завдань
    completedPercentage() {
      const total = this.visibleTasks.length;

      if (!total) return 0;

      const completed = this.visibleTasks.filter(
        (task) => task.status === 'done'
      ).length;

      return Math.round((completed / total) * 100);
    },

    isTaskListEmpty: (state) =>
      state.tasks.length === 0,
  },

  actions: {
    isTitleTaken(title, excludeId = null) {
      const normalized = normalizeTitle(title);

      if (!normalized) return false;

      return this.tasks.some(
        (task) =>
          task.id !== excludeId &&
          normalizeTitle(task.title) === normalized
      );
    },

    // Створення завдання
    addTask(values) {
      const projectStore = useProjectsStore();

      const normalized = normalizeTaskData(
        values,
        projectStore.projects
      );

      if (
        !normalized ||
        this.isTitleTaken(normalized.title)
      ) {
        return null;
      }

      const nextId =
        this.tasks.reduce(
          (maxId, task) => Math.max(maxId, task.id),
          0
        ) + 1;

      const newTask = {
        id: nextId,
        ...normalized,
      };

      this.tasks.push(newTask);

      return newTask;
    },

    // Редагування завдання
    updateTask({ id, ...values }) {
      const task = this.tasks.find(
        (item) => item.id === Number(id)
      );

      if (!task) return null;

      const projectStore = useProjectsStore();

      const normalized = normalizeTaskData(
        values,
        projectStore.projects,
        task
      );

      if (
        !normalized ||
        this.isTitleTaken(normalized.title, task.id)
      ) {
        return null;
      }

      Object.assign(task, normalized);

      return task;
    },

    // Видалення завдання
    deleteTask(id) {
      const index = this.tasks.findIndex(
        (task) => task.id === Number(id)
      );

      if (index === -1) return false;

      this.tasks.splice(index, 1);

      return true;
    },

    // Зміна статусу
    setTaskStatus({ id, status }) {
      if (!allowedStatuses.includes(status)) {
        return false;
      }

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      );

      if (!task) return false;

      task.status = status;

      return true;
    },

    // Зміна пріоритету
    setTaskPriority({ id, priority }) {
      if (!allowedPriorities.includes(priority)) {
        return false;
      }

      const task = this.tasks.find(
        (item) => item.id === Number(id)
      );

      if (!task) return false;

      task.priority = priority;

      return true;
    },

    // Додаткове завдання № 4
    // Групова зміна статусу завдань проєкту
    moveProjectTasksToProgress(projectId) {
      const projectStore = useProjectsStore();

      const projectExists = projectStore.projects.some(
        (project) => project.id === projectId
      );

      if (!projectExists) {
        return 0;
      }

      let updatedCount = 0;

      this.tasks.forEach((task) => {
        if (
          task.projectId === projectId &&
          task.status !== 'progress'
        ) {
          task.status = 'progress';
          updatedCount += 1;
        }
      });

      return updatedCount;
    },

    // Скидання всіх фільтрів
    resetFilters() {
      this.searchText = '';
      this.selectedStatus = 'all';
      this.selectedPriority = 'all';
      this.selectedProject = 'all';
      this.sortOrder = 'newest';
      this.unfinishedOnly = false;
      this.undatedOnly = false;
    },
  },
});
