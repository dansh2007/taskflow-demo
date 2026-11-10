
<script setup>
import { reactive, ref, watch, computed } from 'vue';
import { useTasksStore } from '../store/tasks';

const props = defineProps({
  task: {
    type: Object,
    default: null,
  },
  projects: {
    type: Array,
    required: true,
  },
});

const emit = defineEmits(['save', 'cancel']);
const taskStore = useTasksStore();

const form = reactive({
  title: '',
  description: '',
  status: 'todo',
  priority: 'medium',
  category: 'study',
  dueDate: '',
  projectId: 'general',
});

const error = ref('');
const isEditing = computed(() => props.task !== null);

const remainingTitle = computed(() =>
  80 - form.title.length
);

const remainingDescription = computed(() =>
  500 - form.description.length
);

function todayString() {
  const date = new Date();

  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, '0'),
    String(date.getDate()).padStart(2, '0'),
  ].join('-');
}

const today = todayString();

function validDate(value) {
  if (!value) return true;

  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
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

// Заповнення форми під час редагування
watch(
  () => props.task,
  (task) => {
    form.title = task?.title ?? '';
    form.description = task?.description ?? '';
    form.status = task?.status ?? 'todo';
    form.priority = task?.priority ?? 'medium';
    form.category = task?.category ?? 'study';
    form.dueDate = task?.dueDate ?? '';
    form.projectId = task?.projectId ?? 'general';

    error.value = '';
  },
  { immediate: true }
);

// Очищення форми
function clearForm() {
  form.title = '';
  form.description = '';
  form.status = 'todo';
  form.priority = 'medium';
  form.category = 'study';
  form.dueDate = '';
  form.projectId = 'general';

  error.value = '';
}

// Перевірка та збереження
function submit() {
  const title = form.title.trim();
  const description = form.description.trim();

  if (title.length < 3 || title.length > 80) {
    error.value =
      'Назва завдання повинна містити від 3 до 80 символів.';
    return;
  }

  if (description.length > 500) {
    error.value =
      'Опис завдання не може перевищувати 500 символів.';
    return;
  }

  if (
    taskStore.isTitleTaken(
      title,
      props.task?.id ?? null
    )
  ) {
    error.value =
      'Завдання з такою назвою вже існує.';
    return;
  }

  // Дата необов'язкова, але якщо є — перевіряємо її
  if (!validDate(form.dueDate)) {
    error.value =
      'Вкажіть коректний термін виконання.';
    return;
  }

  const keepingOriginalDate =
    isEditing.value &&
    form.dueDate === props.task.dueDate;

  if (
    form.dueDate &&
    form.dueDate < today &&
    !keepingOriginalDate
  ) {
    error.value =
      'Термін виконання не може бути раніше сьогоднішньої дати.';
    return;
  }

  if (
    !props.projects.some(
      (project) => project.id === form.projectId
    )
  ) {
    error.value = 'Оберіть проєкт зі списку.';
    return;
  }

  error.value = '';

  emit('save', {
    title,
    description,
    status: form.status,
    priority: form.priority,
    category: form.category,
    dueDate: form.dueDate,
    projectId: form.projectId,
  });
}
</script>

<template>
  <section class="tf4-form-panel">
    <div class="tf4-form-heading">
      <div class="tf3-eyebrow">
        TASK EDITOR
      </div>

      <h2>
        {{ isEditing ? 'Редагування завдання' : 'Нове завдання' }}
      </h2>

      <p>
        Заповніть дані завдання та оберіть проєкт.
        Термін виконання можна не вказувати.
      </p>
    </div>

    <form
      class="tf4-form"
      @submit.prevent="submit"
    >
      <!-- Назва -->
      <label>
        Назва завдання *

        <input
          v-model="form.title"
          type="text"
          maxlength="80"
          placeholder="Введіть назву завдання"
          required
        />

        <span class="tf4-hint">
          Залишилося символів: {{ remainingTitle }}
        </span>
      </label>

      <!-- Опис -->
      <label>
        Опис

        <textarea
          v-model="form.description"
          rows="4"
          maxlength="500"
          placeholder="Опишіть завдання"
        ></textarea>

        <span class="tf4-hint">
          Залишилося символів: {{ remainingDescription }}
        </span>
      </label>

      <div class="tf4-form-grid">
        <!-- Статус -->
        <label>
          Статус

          <select v-model="form.status">
            <option value="todo">Заплановано</option>
            <option value="progress">У роботі</option>
            <option value="done">Виконано</option>
          </select>
        </label>

        <!-- Пріоритет -->
        <label>
          Пріоритет

          <select v-model="form.priority">
            <option value="low">Низький</option>
            <option value="medium">Середній</option>
            <option value="high">Високий</option>
          </select>
        </label>
      </div>

      <div class="tf4-form-grid">
        <!-- Категорія -->
        <label>
          Категорія

          <select v-model="form.category">
            <option value="study">Навчання</option>
            <option value="work">Робота</option>
            <option value="personal">Особисте</option>
          </select>
        </label>

        <!-- Проєкт -->
        <label>
          Проєкт

          <select v-model="form.projectId">
            <option
              v-for="project in projects"
              :key="project.id"
              :value="project.id"
            >
              {{ project.title }}
            </option>
          </select>
        </label>
      </div>

      <!-- Необов'язкова дата -->
      <label>
        Термін виконання (необов'язково)

        <input
          v-model="form.dueDate"
          type="date"
          :min="isEditing ? undefined : today"
        />

        <span class="tf4-hint">
          Залиште поле порожнім, якщо термін не визначено.
        </span>
      </label>

      <!-- Повідомлення про помилку -->
      <p
        v-if="error"
        class="tf4-error"
        role="alert"
      >
        {{ error }}
      </p>

      <!-- Кнопки -->
      <div class="tf4-form-actions">
        <button
          type="submit"
          class="tf5-btn tf5-btn--primary"
        >
          {{
            isEditing
              ? 'Зберегти зміни'
              : 'Створити завдання'
          }}
        </button>

        <button
          v-if="!isEditing"
          type="button"
          class="tf5-btn"
          @click="clearForm"
        >
          Очистити форму
        </button>

        <button
          type="button"
          class="tf5-btn"
          @click="emit('cancel')"
        >
          Скасувати
        </button>
      </div>
    </form>
  </section>
</template>
