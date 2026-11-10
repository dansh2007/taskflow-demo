
import { createApp } from 'vue';
import { createPinia } from 'pinia';

import Framework7 from 'framework7/lite-bundle';
import Framework7Vue, {
  registerComponents,
} from 'framework7-vue/bundle';

import 'framework7/css/bundle';
import './css/app.css';

import App from './App.vue';

// Підключення Framework7 до Vue
Framework7.use(Framework7Vue);

// Створюємо застосунок
const app = createApp(App);

// Підключаємо централізоване сховище Pinia
app.use(createPinia());

// Реєструємо компоненти Framework7
registerComponents(app);

// Запускаємо застосунок
app.mount('#app');
