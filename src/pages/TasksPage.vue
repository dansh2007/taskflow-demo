
<script setup>
import { ref, computed, nextTick } from 'vue';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';

import {
  taskState,
  addTask,
  updateTask,
  deleteTask,
  setTaskStatus,
  setTaskPriority,
} from '../store/tasks';

import '../css/task-components.css';
import '../css/task-form.css';
import '../css/task-list.css';

// Пошук, фільтрація та сортування
const searchText = ref('');
const selectedStatus = ref('all');
const selectedPriority = ref('all');
const sortOrder = ref('newest');
const unfinishedOnly = ref(false);

// Створення та редагування
const showForm = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const feedback = ref('');

const editingTask = computed(() => {
  return (
    taskState.tasks.find(
      (task) => task.id === editingId.value
    ) ?? null
  );
});

// Список після застосування фільтрів і сортування
const visibleTasks = computed(() => {
  const term = searchText.value
    .trim()
    .toLocaleLowerCase('uk-UA');

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

  const result = taskState.tasks.filter((task) => {
    const text = `${task.title} ${task.description ?? ''}`
      .toLocaleLowerCase('uk-UA');

    const matchesText =
      !term || text.includes(term);

    const matchesStatus =
      selectedStatus.value === 'all' ||
      task.status === selectedStatus.value;

    const matchesPriority =
      selectedPriority.value === 'all' ||
      task.priority === selectedPriority.value;

    const matchesUnfinished =
      !unfinishedOnly.value ||
      task.status !== 'done';

    return (
      matchesText &&
      matchesStatus &&
      matchesPriority &&
      matchesUnfinished
    );
  });

  return result.sort((a, b) => {
    // За назвою (А–Я)
    if (sortOrder.value === 'title') {
      return (
        a.title.localeCompare(b.title, 'uk-UA') ||
        a.id - b.id
      );
    }

    // За пріоритетом
    if (sortOrder.value === 'priority') {
      return (
        priorityWeight[b.priority] -
          priorityWeight[a.priority] ||
        b.id - a.id
      );
    }

    // За датою: найближчий термін перший
    if (sortOrder.value === 'dueDate') {
      if (!a.dueDate && !b.dueDate) {
        return b.id - a.id;
      }

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return (
        a.dueDate.localeCompare(b.dueDate) ||
        b.id - a.id
      );
    }

    // За статусом:
    // У роботі → Заплановано → Виконано
    if (sortOrder.value === 'status') {
      return (
        statusWeight[a.status] -
          statusWeight[b.status] ||
        b.id - a.id
      );
    }

    // Додаткове завдання № 6:
    // за датою: найпізніший термін перший
    if (sortOrder.value === 'dueDateDesc') {
      if (!a.dueDate && !b.dueDate) {
        return b.id - a.id;
      }

      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;

      return (
        b.dueDate.localeCompare(a.dueDate) ||
        b.id - a.id
      );
    }

    // За замовчуванням — спочатку нові
    return b.id - a.id;
  });
});

// Відсоток виконаних серед показаних завдань
const completedPercentage = computed(() => {
  const total = visibleTasks.value.length;

  if (total === 0) return 0;

  const completed = visibleTasks.value.filter(
    (task) => task.status === 'done'
  ).length;

  return Math.round((completed / total) * 100);
});

// Перевірка, чи є завдання взагалі
const isTaskListEmpty = computed(() => {
  return taskState.tasks.length === 0;
});

function resetFilters() {
  searchText.value = '';
  selectedStatus.value = 'all';
  selectedPriority.value = 'all';
  sortOrder.value = 'newest';
  unfinishedOnly.value = false;
}

async function scrollToForm() {
  await nextTick();

  formAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

async function startCreate() {
  editingId.value = null;
  showForm.value = true;
  feedback.value = '';

  await scrollToForm();
}

async function startEdit(id) {
  editingId.value = id;
  showForm.value = true;
  feedback.value = '';

  await scrollToForm();
}

function cancelForm() {
  editingId.value = null;
  showForm.value = false;
}

function saveTask(values) {
  const isEditing = editingId.value !== null;

  const saved = isEditing
    ? updateTask({
        id: editingId.value,
        ...values,
      })
    : addTask(values);

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.';
    return;
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`;

  cancelForm();
  resetFilters();
}

function handleDelete(id) {
  const task = taskState.tasks.find(
    (item) => item.id === id
  );

  if (!task) return;

  const confirmed = window.confirm(
    `Видалити завдання «${task.title}»?`
  );

  if (!confirmed) return;

  if (deleteTask(id)) {
    feedback.value =
      `Завдання «${task.title}» видалено.`;

    if (editingId.value === id) {
      cancelForm();
    }
  }
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / TASK MANAGER
        </div>

        <h1>Керування завданнями</h1>

        <p>
          Створюйте, редагуйте, знаходьте,
          сортуйте та видаляйте завдання.
        </p>

        <button
          type="button"
          class="tf5-btn tf5-btn--primary tf5-new"
          @click="startCreate"
        >
          + Додати завдання
        </button>
      </section>

      <p
        v-if="feedback"
        class="tf4-feedback"
        role="status"
      >
        {{ feedback }}
      </p>

      <section
        v-if="showForm"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:sort="sortOrder"
        v-model:unfinishedOnly="unfinishedOnly"
        @reset="resetFilters"
      />

      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              TASK LIST
            </div>

            <h2>Список завдань</h2>
          </div>

          <div class="tf5-stats">
            <div class="tf3-counter">
              Показано: {{ visibleTasks.length }}
              із {{ taskState.tasks.length }}
            </div>

            <div class="tf5-percentage">
              Виконано: {{ completedPercentage }}%
            </div>
          </div>
        </div>

        <!-- Картки завдань -->
        <div
          v-if="visibleTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :editable="true"
            @status-change="setTaskStatus"
            @priority-change="setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <!-- Усі завдання видалені -->
        <div
          v-else-if="isTaskListEmpty"
          class="tf5-empty"
        >
          <h3>Список завдань порожній</h3>

          <p>
            Ви ще не маєте завдань.
            Створіть перше завдання, щоб почати роботу.
          </p>

          <button
            type="button"
            class="tf5-btn tf5-btn--primary"
            @click="startCreate"
          >
            + Створити завдання
          </button>
        </div>

        <!-- Фільтри нічого не знайшли -->
        <div v-else class="tf5-empty">
          <h3>Завдань не знайдено</h3>

          <p>
            За поточними умовами завдань не знайдено.
            Спробуйте змінити параметри пошуку.
          </p>

          <button
            type="button"
            class="tf5-btn"
            @click="resetFilters"
          >
            Показати всі завдання
          </button>
        </div>
      </section>
    </div>

    <AppTabbar active="tasks" />
  </f7-page>
</template>

<style scoped>
.tf5-stats {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
}

.tf5-percentage {
  padding: 8px 12px;
  border: 1px solid #3278a6;
  border-radius: 9px;
  background: #173d60;
  color: #a9dfff;
  font-size: 13px;
  font-weight: 700;
}
</style>
