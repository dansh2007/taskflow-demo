
import { defineStore } from 'pinia';
import { useTasksStore } from './tasks';

export const useProjectsStore = defineStore('projects', {
  state: () => ({
    projects: [
      { id: 'general', title: 'Загальні' },
      { id: 'study', title: 'Навчання' },
      { id: 'personal', title: 'Особисті' },
    ],

    nextProjectId: 1,
  }),

  getters: {
    // Загальна кількість проєктів
    projectCount: (state) => state.projects.length,

    // Назва проєкту за його ідентифікатором
    projectTitle: (state) => (id) => {
      const project = state.projects.find(
        (item) => item.id === id
      );

      return project?.title ?? 'Загальні';
    },

    // Додаткове завдання № 1
    // Реактивна статистика для кожного проєкту
    projectStats(state) {
      const taskStore = useTasksStore();

      return state.projects.map((project) => {
        const projectTasks = taskStore.tasks.filter(
          (task) => task.projectId === project.id
        );

        return {
          ...project,
          taskCount: projectTasks.length,
        };
      });
    },
  },

  actions: {
    // Створення нового проєкту
    addProject(rawTitle) {
      const title = String(rawTitle ?? '').trim();

      // Перевірка довжини назви
      if (title.length < 3 || title.length > 40) {
        return null;
      }

      // Перевірка унікальності назви
      const duplicate = this.projects.some(
        (project) =>
          project.title.toLocaleLowerCase('uk-UA') ===
          title.toLocaleLowerCase('uk-UA')
      );

      if (duplicate) {
        return null;
      }

      // Формування нового ідентифікатора
      const project = {
        id: `project-${this.nextProjectId}`,
        title,
      };

      this.nextProjectId += 1;

      // Додавання проєкту до сховища
      this.projects.push(project);

      return project;
    },
  },
});
