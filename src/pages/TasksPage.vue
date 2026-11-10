
<script setup>
import { ref, computed, nextTick } from 'vue';
import { storeToRefs } from 'pinia';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';
import TaskForm from '../components/TaskForm.vue';
import TaskListControls from '../components/TaskListControls.vue';

import { useTasksStore } from '../store/tasks';
import { useProjectsStore } from '../store/projects';

import '../css/task-components.css';
import '../css/task-form.css';
import '../css/task-list.css';

// Централізовані сховища Pinia
const taskStore = useTasksStore();
const projectStore = useProjectsStore();

// Дані та getters завдань
const {
  tasks,
  visibleTasks,
  searchText,
  selectedStatus,
  selectedPriority,
  selectedProject,
  sortOrder,
  unfinishedOnly,
  undatedOnly,
  completedPercentage,
  isTaskListEmpty,
} = storeToRefs(taskStore);

// Дані та getters проєктів
const {
  projects,
  projectCount,
  projectStats,
} = storeToRefs(projectStore);

// Локальний стан сторінки
const showForm = ref(false);
const editingId = ref(null);
const formAnchor = ref(null);
const feedback = ref('');

// Створення проєкту
const newProjectTitle = ref('');
const newProjectError = ref('');

// Групова зміна статусу
const bulkProjectId = ref('general');

const bulkProjectTaskCount = computed(() => {
  return tasks.value.filter(
    (task) => task.projectId === bulkProjectId.value
  ).length;
});

// Редаговане завдання
const editingTask = computed(() => {
  return tasks.value.find(
    (task) => task.id === editingId.value
  ) ?? null;
});

// Прокручування до форми
async function scrollToForm() {
  await nextTick();

  formAnchor.value?.scrollIntoView({
    behavior: 'smooth',
    block: 'start',
  });
}

// Відкриття форми створення
async function startCreate() {
  editingId.value = null;
  showForm.value = true;
  feedback.value = '';

  await scrollToForm();
}

// Відкриття форми редагування
async function startEdit(id) {
  editingId.value = Number(id);
  showForm.value = true;
  feedback.value = '';

  await scrollToForm();
}

// Закриття форми
function cancelForm() {
  editingId.value = null;
  showForm.value = false;
}

// Створення або редагування завдання
function saveTask(values) {
  const isEditing = editingId.value !== null;

  const saved = isEditing
    ? taskStore.updateTask({
        id: editingId.value,
        ...values,
      })
    : taskStore.addTask(values);

  if (!saved) {
    feedback.value =
      'Не вдалося зберегти завдання. Перевірте дані форми.';
    return;
  }

  feedback.value = isEditing
    ? `Завдання «${saved.title}» оновлено.`
    : `Завдання «${saved.title}» створено.`;

  cancelForm();
  taskStore.resetFilters();
}

// Видалення з підтвердженням
function handleDelete(id) {
  const task = tasks.value.find(
    (item) => item.id === Number(id)
  );

  if (!task) return;

  const confirmed = window.confirm(
    `Видалити завдання «${task.title}»?`
  );

  if (!confirmed) return;

  if (taskStore.deleteTask(id)) {
    feedback.value =
      `Завдання «${task.title}» видалено.`;

    if (editingId.value === Number(id)) {
      cancelForm();
    }
  }
}

// Створення нового проєкту
function createProject() {
  const project = projectStore.addProject(
    newProjectTitle.value
  );

  if (!project) {
    newProjectError.value =
      'Назва повинна містити від 3 до 40 символів і бути унікальною.';
    return;
  }

  newProjectTitle.value = '';
  newProjectError.value = '';

  selectedProject.value = project.id;
  bulkProjectId.value = project.id;

  feedback.value =
    `Проєкт «${project.title}» успішно створено.`;
}

// Групова зміна статусів з підтвердженням
function moveAllProjectTasks() {
  const project = projects.value.find(
    (item) => item.id === bulkProjectId.value
  );

  if (!project) {
    feedback.value = 'Оберіть наявний проєкт.';
    return;
  }

  const projectTasks = tasks.value.filter(
    (task) => task.projectId === project.id
  );

  if (projectTasks.length === 0) {
    feedback.value =
      `У проєкті «${project.title}» немає завдань.`;
    return;
  }

  const toUpdate = projectTasks.filter(
    (task) => task.status !== 'progress'
  ).length;

  if (toUpdate === 0) {
    feedback.value =
      `Усі завдання проєкту «${project.title}» уже в роботі.`;
    return;
  }

  const confirmed = window.confirm(
    `Перевести всі завдання проєкту «${project.title}» ` +
    `у статус «У роботі»?\n\n` +
    `Усього завдань: ${projectTasks.length}.\n` +
    `Буде змінено статусів: ${toUpdate}.\n\n` +
    `Це також змінить статус виконаних завдань.`
  );

  if (!confirmed) return;

  const updatedCount =
    taskStore.moveProjectTasksToProgress(project.id);

  feedback.value =
    `У проєкті «${project.title}» переведено в роботу ` +
    `${updatedCount} завдань.`;
}
</script>

<template>
  <f7-page name="tasks" class="tf3-page">
    <f7-navbar title="Мої завдання" />

    <div class="tf3-container">

      <!-- Заголовок -->
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / TASK MANAGER
        </div>

        <h1>Керування завданнями і проєктами</h1>

        <p>
          Створюйте проєкти, керуйте завданнями,
          використовуйте пошук, фільтри та сортування.
        </p>

        <button
          type="button"
          class="tf5-btn tf5-btn--primary tf5-new"
          @click="startCreate"
        >
          + Додати завдання
        </button>
      </section>

      <!-- Повідомлення -->
      <p
        v-if="feedback"
        class="tf4-feedback"
        role="status"
      >
        {{ feedback }}
      </p>

      <!-- Блок проєктів -->
      <section
        class="tf5-panel tf6-project-panel"
        aria-label="Мої проєкти"
      >
        <div class="tf6-project-heading">
          <div>
            <div class="tf3-eyebrow">
              PROJECT MANAGEMENT
            </div>

            <h2>Мої проєкти</h2>
          </div>

          <span class="tf6-project-total">
            Усього: {{ projectCount }}
          </span>
        </div>

        <p class="tf6-project-description">
          Розподіляйте завдання між проєктами
          та відстежуйте їхню кількість.
        </p>

        <!-- Статистика проєктів із Pinia -->
        <div class="tf6-project-list">
          <span
            v-for="project in projectStats"
            :key="project.id"
            class="tf6-project-pill"
          >
            <span>{{ project.title }}</span>

            <strong>
              {{ project.taskCount }}
            </strong>
          </span>
        </div>

        <!-- Створення нового проєкту -->
        <form
          class="tf6-project-form"
          @submit.prevent="createProject"
        >
          <label class="tf6-project-label">
            Назва нового проєкту

            <input
              v-model="newProjectTitle"
              type="text"
              maxlength="40"
              placeholder="Наприклад: Лабораторні"
              @input="newProjectError = ''"
            />
          </label>

          <button
            type="submit"
            class="tf5-btn tf5-btn--primary"
          >
            Створити проєкт
          </button>
        </form>

        <p
          v-if="newProjectError"
          class="tf4-error"
          role="alert"
        >
          {{ newProjectError }}
        </p>

        <!-- Групова зміна статусу -->
        <div class="tf6-bulk-section">
          <div class="tf6-bulk-heading">
            <h3>Групова зміна статусу</h3>

            <p>
              Переведіть усі завдання вибраного
              проєкту в статус «У роботі».
            </p>
          </div>

          <div class="tf6-bulk-controls">
            <label class="tf6-bulk-label">
              Оберіть проєкт

              <select v-model="bulkProjectId">
                <option
                  v-for="project in projects"
                  :key="project.id"
                  :value="project.id"
                >
                  {{ project.title }}
                </option>
              </select>
            </label>

            <button
              type="button"
              class="tf5-btn tf5-btn--primary"
              :disabled="bulkProjectTaskCount === 0"
              @click="moveAllProjectTasks"
            >
              Перевести всі завдання в роботу
            </button>
          </div>

          <p class="tf6-bulk-note">
            Завдань у вибраному проєкті:
            <strong>{{ bulkProjectTaskCount }}</strong>.
            Перед зміною статусів з'явиться підтвердження.
          </p>
        </div>
      </section>

      <!-- Форма завдання -->
      <section
        v-if="showForm"
        ref="formAnchor"
        class="tf4-form-section"
      >
        <TaskForm
          :key="editingId ?? 'new'"
          :task="editingTask"
          :projects="projects"
          @save="saveTask"
          @cancel="cancelForm"
        />
      </section>

      <!-- Фільтри, включно з новим -->
      <TaskListControls
        v-model:search="searchText"
        v-model:status="selectedStatus"
        v-model:priority="selectedPriority"
        v-model:project="selectedProject"
        v-model:sort="sortOrder"
        v-model:unfinishedOnly="unfinishedOnly"
        v-model:undatedOnly="undatedOnly"
        :projects="projects"
        @reset="taskStore.resetFilters"
      />

      <!-- Список завдань -->
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
              із {{ tasks.length }}
            </div>

            <div class="tf5-percentage">
              Виконано: {{ completedPercentage }}%
            </div>
          </div>
        </div>

        <!-- Картки -->
        <div
          v-if="visibleTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in visibleTasks"
            :key="task.id"
            :task="task"
            :project-title="
              projectStore.projectTitle(task.projectId)
            "
            :editable="true"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
            @edit="startEdit"
            @delete="handleDelete"
          />
        </div>

        <!-- Повністю порожній список -->
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

        <!-- Немає результатів пошуку -->
        <div v-else class="tf5-empty">
          <h3>Завдань не знайдено</h3>

          <p>
            За поточними умовами завдань не знайдено.
            Спробуйте змінити параметри пошуку.
          </p>

          <button
            type="button"
            class="tf5-btn"
            @click="taskStore.resetFilters"
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
.tf6-project-panel {
  margin-top: 22px;
}

.tf6-project-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.tf6-project-heading h2 {
  margin: 4px 0 0;
}

.tf6-project-total {
  padding: 7px 12px;
  border: 1px solid #3278a6;
  border-radius: 9px;
  color: #b9e3ff;
  font-size: 13px;
  font-weight: 700;
}

.tf6-project-description {
  margin: 12px 0 18px;
  color: #b8c9db;
  font-size: 14px;
}

.tf6-project-list {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 20px;
}

.tf6-project-pill {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  padding: 10px 14px;
  border: 1px solid #355b79;
  border-radius: 12px;
  background: #1a3652;
  color: #edf4ff;
  font-size: 14px;
}

.tf6-project-pill strong {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 25px;
  height: 25px;
  border-radius: 8px;
  background: #176e9a;
  color: #ffffff;
}

.tf6-project-form {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 12px;
}

.tf6-project-label {
  display: flex;
  flex: 1;
  min-width: 220px;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
}

.tf6-project-label input {
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #3a5a75;
  border-radius: 9px;
  background: #102238;
  color: #edf4ff;
  box-sizing: border-box;
}

.tf6-project-label input::placeholder {
  color: #8299af;
}

/* Групова зміна статусів */
.tf6-bulk-section {
  margin-top: 24px;
  padding-top: 20px;
  border-top: 1px solid #35516d;
}

.tf6-bulk-heading h3 {
  margin: 0 0 8px;
  color: #ffffff;
  font-size: 18px;
}

.tf6-bulk-heading p {
  margin: 0 0 16px;
  color: #b8c9db;
  font-size: 14px;
  line-height: 1.5;
}

.tf6-bulk-controls {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 12px;
}

.tf6-bulk-label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #d7e4f5;
  font-size: 14px;
  font-weight: 600;
}

.tf6-bulk-label select {
  box-sizing: border-box;
  width: 100%;
  min-height: 43px;
  padding: 10px 12px;
  border: 1px solid #39526f;
  border-radius: 9px;
  background: #0c1728;
  color: #f0f7ff;
  color-scheme: dark;
}

.tf6-bulk-controls button {
  min-height: 43px;
}

.tf6-bulk-controls button:disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.tf6-bulk-note {
  margin: 12px 0 0;
  color: #a9bfd4;
  font-size: 13px;
}

/* Статистика списку */
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

@media (max-width: 600px) {
  .tf6-project-form {
    flex-direction: column;
    align-items: stretch;
  }

  .tf6-project-label {
    min-width: 0;
    width: 100%;
  }

  .tf6-project-form button {
    width: 100%;
  }

  .tf6-bulk-controls {
    grid-template-columns: 1fr;
  }

  .tf6-bulk-controls button {
    width: 100%;
  }
}
</style>
