
<script setup>
import { computed } from 'vue';
import { storeToRefs } from 'pinia';

import AppTabbar from '../components/AppTabbar.vue';
import TaskCard from '../components/TaskCard.vue';

import { useTasksStore } from '../store/tasks';
import { useProjectsStore } from '../store/projects';

import '../css/task-components.css';
import '../css/task-list.css';

const taskStore = useTasksStore();
const projectStore = useProjectsStore();

// Статистика зі спільного Pinia-сховища
const {
  tasks,
  totalTasks,
  completedTasks,
  progressTasks,
  plannedTasks,
  activeTasks,
} = storeToRefs(taskStore);

// Дані проєктів
const {
  projectCount,
  projectStats,
} = storeToRefs(projectStore);

// Назва проєкту для картки завдання
function projectTitleFor(task) {
  return projectStore.projectTitle(task.projectId);
}

// Статистика виконання для кожного проєкту
const projectProgressStats = computed(() => {
  return projectStats.value.map((project) => {
    const projectTasks = tasks.value.filter(
      (task) => task.projectId === project.id
    );

    const total = projectTasks.length;

    const completed = projectTasks.filter(
      (task) => task.status === 'done'
    ).length;

    const unfinished = total - completed;

    const percentage =
      total === 0
        ? 0
        : Math.round((completed / total) * 100);

    return {
      ...project,
      total,
      completed,
      unfinished,
      percentage,
    };
  });
});
</script>

<template>
  <f7-page name="home" class="tf3-page">
    <f7-navbar title="TaskFlow">
      <f7-nav-right>
        <f7-link href="/about/">
          Про застосунок
        </f7-link>
      </f7-nav-right>
    </f7-navbar>

    <div class="tf3-container">
      <!-- Заголовок -->
      <section class="tf3-hero">
        <div class="tf3-eyebrow">
          TASKFLOW / DASHBOARD
        </div>

        <h1>Панель керування</h1>

        <p>
          Контролюйте виконання завдань,
          відстежуйте пріоритети та керуйте проєктами.
        </p>

        <div class="tf6-home-projects">
          <span>Проєктів у TaskFlow:</span>
          <strong>{{ projectCount }}</strong>
        </div>
      </section>

      <!-- Загальна статистика -->
      <section
        class="tf3-stat-grid"
        aria-label="Статистика завдань"
      >
        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Усього завдань
          </span>

          <strong>{{ totalTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            У роботі
          </span>

          <strong>{{ progressTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Виконано
          </span>

          <strong>{{ completedTasks }}</strong>
        </div>

        <div class="tf3-stat">
          <span class="tf3-stat-label">
            Заплановано
          </span>

          <strong>{{ plannedTasks }}</strong>
        </div>
      </section>

      <!-- Статистика за проєктами -->
      <section
        class="tf5-panel tf6-home-project-panel"
        aria-label="Статистика проєктів"
      >
        <div class="tf6-home-project-heading">
          <div>
            <div class="tf3-eyebrow">
              PROJECT OVERVIEW
            </div>

            <h2>Завдання за проєктами</h2>
          </div>
        </div>

        <p class="tf6-home-project-description">
          Кількість невиконаних завдань
          і прогрес кожного проєкту.
        </p>

        <div class="tf6-home-project-grid">
          <div
            v-for="project in projectProgressStats"
            :key="project.id"
            class="tf6-home-project-card"
          >
            <span class="tf6-home-project-name">
              {{ project.title }}
            </span>

            <strong class="tf6-home-project-count">
              {{ project.unfinished }}
            </strong>

            <span class="tf6-home-project-caption">
              Невиконаних завдань
            </span>

            <!-- Додаткове завдання № 3 -->
            <div class="tf6-progress-section">
              <div class="tf6-progress-heading">
                <span>Виконано</span>

                <strong>
                  {{ project.percentage }}%
                </strong>
              </div>

              <div
                class="tf6-progress-track"
                role="progressbar"
                :aria-valuenow="project.percentage"
                aria-valuemin="0"
                aria-valuemax="100"
                :aria-label="
                  `Виконання проєкту ${project.title}`
                "
              >
                <div
                  class="tf6-progress-fill"
                  :style="{
                    width: `${project.percentage}%`
                  }"
                ></div>
              </div>

              <span class="tf6-progress-caption">
                {{ project.completed }} із
                {{ project.total }} завдань
              </span>
            </div>
          </div>
        </div>
      </section>

      <!-- Актуальні завдання -->
      <section class="tf3-section">
        <div class="tf3-section-heading">
          <div>
            <div class="tf3-eyebrow">
              PRIORITY TASKS
            </div>

            <h2>Актуальні завдання</h2>
          </div>

          <f7-button
            href="/tasks/"
            outline
            small
          >
            Переглянути всі
          </f7-button>
        </div>

        <div
          v-if="activeTasks.length"
          class="tf3-task-grid"
        >
          <TaskCard
            v-for="task in activeTasks"
            :key="task.id"
            :task="task"
            :project-title="projectTitleFor(task)"
            :editable="false"
            @status-change="taskStore.setTaskStatus"
            @priority-change="taskStore.setTaskPriority"
          />
        </div>

        <div v-else class="tf3-empty">
          Наразі всі завдання виконані.
        </div>
      </section>
    </div>

    <AppTabbar active="home" />
  </f7-page>
</template>

<style scoped>
.tf6-home-projects {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  margin-top: 16px;
  padding: 10px 15px;
  border: 1px solid #3278a6;
  border-radius: 10px;
  background: #173d60;
  color: #c8e7fc;
  font-size: 14px;
  font-weight: 600;
}

.tf6-home-projects strong {
  color: #ffffff;
  font-size: 20px;
}

.tf6-home-project-panel {
  margin-top: 24px;
}

.tf6-home-project-heading h2 {
  margin: 4px 0 0;
}

.tf6-home-project-description {
  margin: 4px 0 18px;
  color: #b8c9db;
  font-size: 14px;
}

.tf6-home-project-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.tf6-home-project-card {
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 17px;
  border: 1px solid #355b79;
  border-radius: 13px;
  background: #192e48;
}

.tf6-home-project-name {
  color: #e8f3ff;
  font-size: 15px;
  font-weight: 600;
}

.tf6-home-project-count {
  color: #ffffff;
  font-size: 30px;
  line-height: 1.2;
}

.tf6-home-project-caption {
  color: #a9bfd4;
  font-size: 12px;
}

/* Прогрес виконання проєкту */

.tf6-progress-section {
  margin-top: 8px;
  padding-top: 14px;
  border-top: 1px solid #35516d;
}

.tf6-progress-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
  color: #d7e8f8;
  font-size: 13px;
}

.tf6-progress-heading strong {
  color: #7ed9ff;
  font-size: 17px;
}

.tf6-progress-track {
  width: 100%;
  height: 9px;
  overflow: hidden;
  border-radius: 20px;
  background: #0d1c30;
}

.tf6-progress-fill {
  height: 100%;
  border-radius: 20px;
  background: #168fbd;
  transition: width 0.3s ease;
}

.tf6-progress-caption {
  display: block;
  margin-top: 9px;
  color: #9db5cc;
  font-size: 12px;
}

@media (max-width: 520px) {
  .tf6-home-project-grid {
    grid-template-columns: 1fr;
  }
}
</style>
