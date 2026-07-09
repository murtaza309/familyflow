import './today.css';

import {
  getTasks,
  getTodayDateString,
  toggleTaskCompletion
} from './tasks.js';

import {
  getChildrenData
} from './children.js';


/* =========================================
   FAMILYFLOW — GLOBAL TODAY VIEW
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let todayTasks = [];

let todayChildren = [];

let activeTodayFilter = 'all';

let pendingTaskIds = new Set();

let tasksUpdatedHandler = null;

let childrenUpdatedHandler = null;

let todayCallbacks = {

  onAddTask:
    null,

  onOpenChild:
    null

};


/* =========================================
   ICONS
========================================= */

const icons = {

  plus: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  `,


  calendar: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect
        x="3"
        y="5"
        width="18"
        height="16"
        rx="3"
      ></rect>

      <path d="M8 3v4"></path>
      <path d="M16 3v4"></path>
      <path d="M3 10h18"></path>
    </svg>
  `,


  tasks: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect
        x="4"
        y="4"
        width="16"
        height="16"
        rx="3"
      ></rect>

      <path d="m8 12 2.5 2.5L16 9"></path>
    </svg>
  `,


  check: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2.4"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m5 12 4 4L19 6"></path>
    </svg>
  `,


  arrow: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M5 12h14"></path>
      <path d="m14 7 5 5-5 5"></path>
    </svg>
  `

};


/* =========================================
   BASIC HELPERS
========================================= */

function escapeTodayHtml(
  value = ''
) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function getTodayDateLabel() {

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      weekday:
        'long',

      day:
        'numeric',

      month:
        'long',

      year:
        'numeric'
    }
  ).format(
    new Date()
  );

}


function getTodayChildById(
  childId = ''
) {

  return todayChildren.find(
    (child) =>
      child.id === childId
  ) || null;

}


function getTodayChildInitial(
  name = ''
) {

  const cleanName =
    String(name).trim();


  return cleanName
    ? cleanName
        .charAt(0)
        .toUpperCase()
    : 'C';

}


function getSafeTodayChildColour(
  colour = 'green'
) {

  const allowedColours = [
    'green',
    'blue',
    'purple',
    'orange',
    'rose'
  ];


  return allowedColours.includes(
    colour
  )
    ? colour
    : 'green';

}


/* =========================================
   TASK CATEGORY HELPERS
========================================= */

function getTodayTaskCategoryLabel(
  category = 'general'
) {

  const labels = {

    general:
      'General',

    homework:
      'Homework',

    school:
      'School',

    chore:
      'Chore',

    appointment:
      'Appointment',

    reminder:
      'Reminder'

  };


  return labels[category]
    || 'General';

}


function getSafeTodayTaskCategory(
  category = 'general'
) {

  const allowedCategories = [
    'general',
    'homework',
    'school',
    'chore',
    'appointment',
    'reminder'
  ];


  return allowedCategories.includes(
    category
  )
    ? category
    : 'general';

}


/* =========================================
   TIME FORMATTER
========================================= */

function formatTodayTaskTime(
  timeValue = ''
) {

  if (!timeValue) {
    return '';
  }


  const [
    hours,
    minutes
  ] =
    String(timeValue)
      .split(':')
      .map(Number);


  if (
    Number.isNaN(hours)
    || Number.isNaN(minutes)
  ) {

    return timeValue;

  }


  const date =
    new Date();


  date.setHours(
    hours,
    minutes,
    0,
    0
  );


  return new Intl.DateTimeFormat(
    'en-GB',
    {
      hour:
        'numeric',

      minute:
        '2-digit'
    }
  ).format(date);

}


/* =========================================
   SORT TODAY TASKS
========================================= */

function sortTodayTasks(
  tasks = []
) {

  return [...tasks].sort(
    (taskA, taskB) => {

      /*
        Open tasks before completed tasks.
      */

      const completedDifference =
        Number(
          Boolean(taskA.completed)
        )
        - Number(
          Boolean(taskB.completed)
        );


      if (
        completedDifference !== 0
      ) {

        return completedDifference;

      }


      /*
        Timed tasks first.
      */

      const timeA =
        taskA.dueTime
        || '23:59';


      const timeB =
        taskB.dueTime
        || '23:59';


      if (timeA !== timeB) {

        return timeA.localeCompare(
          timeB
        );

      }


      /*
        Alphabetical fallback.
      */

      return String(
        taskA.title || ''
      ).localeCompare(
        String(
          taskB.title || ''
        )
      );

    }
  );

}


/* =========================================
   GET TODAY TASK STATISTICS
========================================= */

function getTodayTaskStats() {

  const total =
    todayTasks.length;


  const completed =
    todayTasks.filter(
      (task) =>
        task.completed
    ).length;


  const open =
    total
    - completed;


  const progress =
    total
      ? Math.round(
          (
            completed
            / total
          )
          * 100
        )
      : 0;


  return {

    total,

    open,

    completed,

    progress

  };

}


/* =========================================
   GET FILTERED TODAY TASKS
========================================= */

function getFilteredTodayTasks() {

  if (
    activeTodayFilter
    === 'open'
  ) {

    return todayTasks.filter(
      (task) =>
        !task.completed
    );

  }


  if (
    activeTodayFilter
    === 'completed'
  ) {

    return todayTasks.filter(
      (task) =>
        task.completed
    );

  }


  return [
    ...todayTasks
  ];

}


/* =========================================
   CREATE TODAY SUMMARY
========================================= */

function createTodaySummary() {

  const stats =
    getTodayTaskStats();


  return `
    <div class="today-summary-grid">

      <article class="today-summary-card">

        <span class="today-summary-label">
          Total today
        </span>

        <strong>
          ${stats.total}
        </strong>

        <small>
          ${
            stats.total === 1
              ? '1 task due today'
              : `${stats.total} tasks due today`
          }
        </small>

      </article>


      <article class="today-summary-card">

        <span class="today-summary-label">
          Still open
        </span>

        <strong>
          ${stats.open}
        </strong>

        <small>
          ${
            stats.open === 0
              ? 'Nothing outstanding'
              : stats.open === 1
                ? '1 task needs attention'
                : `${stats.open} tasks need attention`
          }
        </small>

      </article>


      <article class="today-summary-card">

        <span class="today-summary-label">
          Completed
        </span>

        <strong>
          ${stats.completed}
        </strong>

        <small>
          ${
            stats.completed === 0
              ? 'Nothing completed yet'
              : stats.completed === 1
                ? '1 task finished'
                : `${stats.completed} tasks finished`
          }
        </small>

      </article>


      <article class="today-summary-card today-progress-card">

        <div class="today-progress-card-top">

          <span class="today-summary-label">
            Daily progress
          </span>

          <strong>
            ${stats.progress}%
          </strong>

        </div>


        <div
          class="today-progress-track"
          aria-label="${stats.progress}% of today's tasks complete"
        >

          <span
            class="today-progress-fill"
            style="width: ${stats.progress}%"
          ></span>

        </div>


        <small>
          ${
            stats.total === 0
              ? 'Your day is clear'
              : stats.progress === 100
                ? 'Everything is complete'
                : 'Keep the day moving'
          }
        </small>

      </article>

    </div>
  `;

}


/* =========================================
   CREATE TODAY FILTERS
========================================= */

function createTodayFilters() {

  const stats =
    getTodayTaskStats();


  const filters = [

    {
      id:
        'all',

      label:
        'All',

      count:
        stats.total
    },

    {
      id:
        'open',

      label:
        'Open',

      count:
        stats.open
    },

    {
      id:
        'completed',

      label:
        'Completed',

      count:
        stats.completed
    }

  ];


  return `
    <div
      class="today-filter-bar"
      role="group"
      aria-label="Filter today's tasks"
    >

      ${filters
        .map((filter) => {

          const isActive =
            activeTodayFilter
            === filter.id;


          return `
            <button
              type="button"
              class="
                today-filter-button
                ${isActive ? 'is-active' : ''}
              "
              data-today-filter="${filter.id}"
              aria-pressed="${isActive}"
            >

              <span>
                ${filter.label}
              </span>

              <strong>
                ${filter.count}
              </strong>

            </button>
          `;

        })
        .join('')}

    </div>
  `;

}


/* =========================================
   CREATE TODAY TASK CARD
========================================= */

function createTodayTaskCard(
  task
) {

  const id =
    escapeTodayHtml(
      task?.id || ''
    );


  const title =
    escapeTodayHtml(
      task?.title
      || 'Untitled task'
    );


  const notes =
    escapeTodayHtml(
      task?.notes || ''
    );


  const child =
    getTodayChildById(
      task?.childId || ''
    );


  const childName =
    escapeTodayHtml(
      child?.name
      || 'Child'
    );


  const childColour =
    getSafeTodayChildColour(
      child?.colour
    );


  const childInitial =
    escapeTodayHtml(
      getTodayChildInitial(
        child?.name
      )
    );


  const category =
    getSafeTodayTaskCategory(
      task?.category
    );


  const categoryLabel =
    escapeTodayHtml(
      getTodayTaskCategoryLabel(
        category
      )
    );


  const time =
    formatTodayTaskTime(
      task?.dueTime || ''
    );


  const completed =
    Boolean(
      task?.completed
    );


  const isPending =
    pendingTaskIds.has(
      task?.id
    );


  return `
    <article
      class="
        today-task-card
        ${completed ? 'is-completed' : ''}
        ${isPending ? 'is-busy' : ''}
      "
      data-today-task-id="${id}"
    >

      <!-- COMPLETION -->

      <button
        type="button"
        class="
          today-task-complete-button
          ${completed ? 'is-completed' : ''}
        "
        data-today-toggle-task="${id}"
        aria-label="${
          completed
            ? `Mark ${title} as incomplete`
            : `Mark ${title} as complete`
        }"
        ${isPending ? 'disabled' : ''}
      >

        ${
          completed
            ? icons.check
            : ''
        }

      </button>


      <!-- MAIN TASK DETAILS -->

      <div class="today-task-main">

        <div class="today-task-heading">

          <h3>
            ${title}
          </h3>


          <span
            class="
              today-task-category
              today-task-category-${category}
            "
          >
            ${categoryLabel}
          </span>

        </div>


        ${
          notes
            ? `
              <p class="today-task-notes">
                ${notes}
              </p>
            `
            : ''
        }


        <div class="today-task-meta">

          ${
            time
              ? `
                <span class="today-task-time">
                  ${escapeTodayHtml(time)}
                </span>
              `
              : `
                <span class="today-task-time">
                  Anytime today
                </span>
              `
          }

        </div>

      </div>


      <!-- CHILD -->

      <button
        type="button"
        class="today-task-child"
        data-today-open-child="${escapeTodayHtml(
          task?.childId || ''
        )}"
        aria-label="Open ${childName}'s profile"
      >

        <span
          class="
            today-task-child-avatar
            today-task-child-avatar-${childColour}
          "
        >
          ${childInitial}
        </span>


        <span class="today-task-child-details">

          <small>
            For
          </small>

          <strong>
            ${childName}
          </strong>

        </span>


        <span class="today-task-child-arrow">
          ${icons.arrow}
        </span>

      </button>

    </article>
  `;

}


/* =========================================
   CREATE TODAY EMPTY STATE
========================================= */

function createTodayEmptyState() {

  const stats =
    getTodayTaskStats();


  if (
    stats.total > 0
    && activeTodayFilter === 'open'
    && stats.open === 0
  ) {

    return `
      <div class="today-empty-state">

        <div class="today-empty-icon">
          ${icons.check}
        </div>


        <span class="today-empty-eyebrow">
          Everything complete
        </span>


        <h2>
          Nothing left open today
        </h2>


        <p>
          Every task due today has been completed.
          Nice work keeping the family organised.
        </p>

      </div>
    `;

  }


  if (
    stats.total > 0
    && activeTodayFilter === 'completed'
    && stats.completed === 0
  ) {

    return `
      <div class="today-empty-state">

        <div class="today-empty-icon">
          ${icons.tasks}
        </div>


        <span class="today-empty-eyebrow">
          Nothing completed yet
        </span>


        <h2>
          Today's completed tasks will appear here
        </h2>


        <p>
          Mark a task as complete and it will move into this view automatically.
        </p>

      </div>
    `;

  }


  return `
    <div class="today-empty-state">

      <div class="today-empty-icon">
        ${icons.calendar}
      </div>


      <span class="today-empty-eyebrow">
        Your day is clear
      </span>


      <h2>
        Nothing is due today
      </h2>


      <p>
        Add a task for one of your children and choose today as its due date.
        It will appear here automatically.
      </p>


      <button
        type="button"
        class="children-primary-button"
        id="todayEmptyAddTaskButton"
      >
        ${icons.plus}

        <span>
          Add a task
        </span>
      </button>

    </div>
  `;

}


/* =========================================
   CREATE TODAY TASK LIST
========================================= */

function createTodayTaskList() {

  const filteredTasks =
    getFilteredTodayTasks();


  if (!filteredTasks.length) {
    return createTodayEmptyState();
  }


  return `
    <div class="today-task-list">

      ${filteredTasks
        .map(
          (task) =>
            createTodayTaskCard(
              task
            )
        )
        .join('')}

    </div>
  `;

}


/* =========================================
   CREATE COMPLETE TODAY VIEW
========================================= */

export function createTodayView() {

  return `
    <section
      class="app-view today-view"
      data-app-view="today"
      hidden
    >

      <!-- =====================================
           PAGE HEADER
      ====================================== -->

      <div class="today-page-header">

        <div>

          <span class="today-page-eyebrow">
            Your family today
          </span>


          <h1>
            Today
          </h1>


          <p>
            Everything that needs attention today,
            across your whole family.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="todayAddTaskButton"
        >
          ${icons.plus}

          <span>
            Add task
          </span>
        </button>

      </div>


      <!-- =====================================
           DATE BANNER
      ====================================== -->

      <div class="today-date-banner">

        <div class="today-date-icon">
          ${icons.calendar}
        </div>


        <div>

          <span>
            Today
          </span>

          <strong>
            ${getTodayDateLabel()}
          </strong>

        </div>

      </div>


      <!-- =====================================
           SUMMARY
      ====================================== -->

      <div id="todaySummaryContainer">
        ${createTodaySummary()}
      </div>


      <!-- =====================================
           MAIN TASK WORKSPACE
      ====================================== -->

      <section class="today-workspace">

        <div class="today-workspace-header">

          <div>

            <span class="today-workspace-eyebrow">
              Today's plan
            </span>


            <h2>
              What needs attention
            </h2>


            <p>
              Keep track of every task due today and move through the day with clarity.
            </p>

          </div>

        </div>


        <div id="todayFiltersContainer">
          ${createTodayFilters()}
        </div>


        <div
          class="today-task-list-container"
          id="todayTaskListContainer"
        >
          ${createTodayTaskList()}
        </div>

      </section>

    </section>
  `;

}


/* =========================================
   REFRESH TODAY VIEW
========================================= */

function refreshTodayView() {

  const summaryContainer =
    document.querySelector(
      '#todaySummaryContainer'
    );


  const filtersContainer =
    document.querySelector(
      '#todayFiltersContainer'
    );


  const taskListContainer =
    document.querySelector(
      '#todayTaskListContainer'
    );


  if (summaryContainer) {

    summaryContainer.innerHTML =
      createTodaySummary();

  }


  if (filtersContainer) {

    filtersContainer.innerHTML =
      createTodayFilters();

  }


  if (taskListContainer) {

    taskListContainer.innerHTML =
      createTodayTaskList();

  }


  attachDynamicTodayListeners();

}


/* =========================================
   UPDATE TASK DATA
========================================= */

function updateTodayTasks(
  tasks = []
) {

  const safeTasks =
    Array.isArray(tasks)
      ? tasks
      : [];


  const today =
    getTodayDateString();


  todayTasks =
    sortTodayTasks(
      safeTasks.filter(
        (task) =>
          task.dueDate === today
      )
    );


  refreshTodayView();

}


/* =========================================
   UPDATE CHILDREN DATA
========================================= */

function updateTodayChildren(
  children = []
) {

  todayChildren =
    Array.isArray(children)
      ? children.map(
          (child) => ({
            ...child
          })
        )
      : [];


  refreshTodayView();

}


/* =========================================
   CHANGE TODAY FILTER
========================================= */

function changeTodayFilter(
  filterId
) {

  const allowedFilters = [
    'all',
    'open',
    'completed'
  ];


  if (
    !allowedFilters.includes(
      filterId
    )
  ) {
    return;
  }


  activeTodayFilter =
    filterId;


  refreshTodayView();

}


/* =========================================
   TOGGLE TASK COMPLETION
========================================= */

async function handleTodayTaskToggle(
  taskId
) {

  if (
    !taskId
    || pendingTaskIds.has(taskId)
  ) {
    return;
  }


  const task =
    todayTasks.find(
      (item) =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  try {

    pendingTaskIds.add(
      taskId
    );


    refreshTodayView();


    await toggleTaskCompletion(
      task.id,
      !task.completed
    );

  } catch (error) {

    console.error(
      'Failed to update task from Today view:',
      error
    );

  } finally {

    pendingTaskIds.delete(
      taskId
    );


    refreshTodayView();

  }

}


/* =========================================
   ADD TASK ACTION
========================================= */

function handleTodayAddTask() {

  if (
    typeof todayCallbacks.onAddTask
    === 'function'
  ) {

    todayCallbacks.onAddTask();

  }

}


/* =========================================
   OPEN CHILD ACTION
========================================= */

function handleTodayOpenChild(
  childId
) {

  if (!childId) {
    return;
  }


  if (
    typeof todayCallbacks.onOpenChild
    === 'function'
  ) {

    todayCallbacks.onOpenChild(
      childId
    );

  }

}


/* =========================================
   DYNAMIC LISTENERS
========================================= */

function attachDynamicTodayListeners() {

  document
    .querySelectorAll(
      '[data-today-filter]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          changeTodayFilter(
            button.dataset
              .todayFilter
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-today-toggle-task]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handleTodayTaskToggle(
            button.dataset
              .todayToggleTask
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-today-open-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handleTodayOpenChild(
            button.dataset
              .todayOpenChild
          );

        }
      );

    });


  document
    .querySelector(
      '#todayEmptyAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handleTodayAddTask
    );

}


/* =========================================
   INITIALISE TODAY VIEW
========================================= */

export function initialiseTodayView({
  onAddTask = null,
  onOpenChild = null
} = {}) {

  /*
    Store callbacks from the app shell.

    This keeps Today independent from
    navigation and child-profile internals.
  */

  todayCallbacks = {

    onAddTask:
      typeof onAddTask === 'function'
        ? onAddTask
        : null,

    onOpenChild:
      typeof onOpenChild === 'function'
        ? onOpenChild
        : null

  };


  /*
    Seed the view from the current module state.
  */

  updateTodayChildren(
    getChildrenData()
  );


  updateTodayTasks(
    getTasks()
  );


  /*
    Permanent top-level add button.
  */

  const addTaskButton =
    document.querySelector(
      '#todayAddTaskButton'
    );


  addTaskButton?.addEventListener(
    'click',
    handleTodayAddTask
  );


  /*
    Remove any previous global event
    listeners before attaching new ones.

    This prevents duplicate handlers if the
    app shell is ever rendered again.
  */

  if (tasksUpdatedHandler) {

    window.removeEventListener(
      'familyflow:tasks-updated',
      tasksUpdatedHandler
    );

  }


  if (childrenUpdatedHandler) {

    window.removeEventListener(
      'familyflow:children-updated',
      childrenUpdatedHandler
    );

  }


  tasksUpdatedHandler =
    (event) => {

      updateTodayTasks(
        event.detail?.tasks || []
      );

    };


  childrenUpdatedHandler =
    (event) => {

      updateTodayChildren(
        event.detail?.children || []
      );

    };


  window.addEventListener(
    'familyflow:tasks-updated',
    tasksUpdatedHandler
  );


  window.addEventListener(
    'familyflow:children-updated',
    childrenUpdatedHandler
  );


  attachDynamicTodayListeners();

}


/* =========================================
   PUBLIC REFRESH
========================================= */

export function refreshTodayViewData() {

  updateTodayChildren(
    getChildrenData()
  );


  updateTodayTasks(
    getTasks()
  );

}