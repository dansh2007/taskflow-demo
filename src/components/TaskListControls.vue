
<script setup>
defineProps({
  search: { type: String, default: '' },
  status: { type: String, default: 'all' },
  priority: { type: String, default: 'all' },
  sort: { type: String, default: 'newest' },
  unfinishedOnly: { type: Boolean, default: false },
});

const emit = defineEmits([
  'update:search',
  'update:status',
  'update:priority',
  'update:sort',
  'update:unfinishedOnly',
  'reset',
]);

function clearSearch() {
  emit('update:search', '');
}
</script>

<template>
  <section class="tf5-panel" aria-label="Пошук і фільтри">
    <h2>Пошук і впорядкування</h2>

    <div class="tf5-controls-grid">
      <div class="tf5-search">
        <label for="tf5-search-input">
          Пошук за назвою та описом
        </label>

        <div class="tf5-search-row">
          <input
            id="tf5-search-input"
            type="search"
            :value="search"
            placeholder="Наприклад: інтерфейс"
            @input="emit('update:search', $event.target.value)"
          />

          <button
            v-if="search.length > 0"
            type="button"
            class="tf5-btn tf5-clear-search"
            @click="clearSearch"
          >
            Очистити пошук
          </button>
        </div>
      </div>

      <label>
        Статус

        <select
          :value="status"
          @change="emit('update:status', $event.target.value)"
        >
          <option value="all">Усі статуси</option>
          <option value="todo">Заплановано</option>
          <option value="progress">У роботі</option>
          <option value="done">Виконано</option>
        </select>
      </label>

      <label>
        Пріоритет

        <select
          :value="priority"
          @change="emit('update:priority', $event.target.value)"
        >
          <option value="all">Усі пріоритети</option>
          <option value="low">Низький</option>
          <option value="medium">Середній</option>
          <option value="high">Високий</option>
        </select>
      </label>

      <label>
        Сортування

        <select
          :value="sort"
          @change="emit('update:sort', $event.target.value)"
        >
          <option value="newest">
            Спочатку нові
          </option>

          <option value="title">
            За назвою (А–Я)
          </option>

          <option value="priority">
            За пріоритетом (високий перший)
          </option>

          <option value="dueDate">
            За терміном (найближчий перший)
          </option>

          <option value="status">
            За статусом (у роботі → заплановано → виконано)
          </option>

          <option value="dueDateDesc">
            За терміном (найпізніший перший)
          </option>
        </select>
      </label>
    </div>

    <label class="tf5-quick-filter">
      <input
        type="checkbox"
        :checked="unfinishedOnly"
        @change="
          emit('update:unfinishedOnly', $event.target.checked)
        "
      />

      <span>Тільки невиконані</span>
    </label>

    <button
      type="button"
      class="tf5-btn"
      @click="emit('reset')"
    >
      Скинути фільтри
    </button>
  </section>
</template>

<style scoped>
.tf5-search-row {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tf5-search-row input {
  flex: 1;
  min-width: 0;
}

.tf5-clear-search {
  flex-shrink: 0;
  white-space: nowrap;
}

.tf5-quick-filter {
  display: flex;
  align-items: center;
  gap: 10px;
  margin: 18px 0;
  color: #edf4ff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
}

.tf5-quick-filter input {
  width: 18px;
  height: 18px;
  accent-color: #168fbd;
  cursor: pointer;
}

@media (max-width: 600px) {
  .tf5-search-row {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
