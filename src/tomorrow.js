import './tomorrow.css';

import {
  getTasks,
  toggleTaskCompletion
} from './tasks.js';

import {
  getChildrenData
} from './children.js';


/* =========================================
   FAMILYFLOW — PREPARE FOR TOMORROW
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let tomorrowTasks =
  [];


let tomorrowChildren =
  [];


let activeTomorrowChildFilter =
  'all';


let pendingTomorrowTaskIds =
  new Set();


let tomorrowTasksUpdatedHandler =
  null;


let tomorrowChildrenUpdatedHandler =
  null;


let tomorrowCallbacks = {

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


  tomorrow: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z"
      ></path>

      <path d="M8 8h8"></path>
      <path d="M8 12h5"></path>
      <path d="m8 16 2 2 5-5"></path>
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
  `,


  child: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle
        cx="12"
        cy="8"
        r="3"
      ></circle>

      <path
        d="M5 20c0-4 3-7 7-7s7 3 7 7"
      ></path>
    </svg>
  `,


  empty: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z"
      ></path>

      <path d="M8 9h8"></path>
      <path d="M8 13h5"></path>
    </svg>
  `

};


/* =========================================
   BASIC HELPERS
========================================= */

function escapeTomorrowHtml(
  value = ''
) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


/* =========================================
   DATE HELPERS
========================================= */

function createDateString(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(2, '0');


  const day =
    String(
      date.getDate()
    ).padStart(2, '0');


  return `${year}-${month}-${day}`;

}


export function getTomorrowDateString() {

  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  return createDateString(
    tomorrow
  );

}


function getTomorrowDateLabel() {

  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


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
  ).format(tomorrow);

}


/* =========================================
   CHILD HELPERS
========================================= */

function getTomorrowChildById(
  childId = ''
) {

  return tomorrowChildren.find(
    (child) =>
      child.id === childId
  ) || null;

}


function getTomorrowChildInitial(
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


function getSafeTomorrowChildColour(
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

function getTomorrowTaskCategoryLabel(
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


function getSafeTomorrowTaskCategory(
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

function formatTomorrowTaskTime(
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
   SORT TOMORROW TASKS
========================================= */

function sortTomorrowTasks(
  tasks = []
) {

  return [...tasks].sort(
    (
      taskA,
      taskB
    ) => {

      /*
        Open tasks first.
      */

      const completedDifference =
        Number(
          Boolean(
            taskA.completed
          )
        )
        - Number(
          Boolean(
            taskB.completed
          )
        );


      if (
        completedDifference !== 0
      ) {

        return completedDifference;

      }


      /*
        Earlier timed tasks first.
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
   FILTERED TOMORROW TASKS
========================================= */

function getFilteredTomorrowTasks() {

  if (
    activeTomorrowChildFilter
    === 'all'
  ) {

    return [
      ...tomorrowTasks
    ];

  }


  return tomorrowTasks.filter(
    (task) =>
      task.childId
      === activeTomorrowChildFilter
  );

}


/* =========================================
   TOMORROW STATISTICS
========================================= */

function getTomorrowStats() {

  const tasks =
    getFilteredTomorrowTasks();


  const total =
    tasks.length;


  const completed =
    tasks.filter(
      (task) =>
        task.completed
    ).length;


  const open =
    total
    - completed;


  const childrenPlanned =
    new Set(
      tasks
        .map(
          (task) =>
            task.childId
        )
        .filter(Boolean)
    ).size;


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

    childrenPlanned,

    progress

  };

}


/* =========================================
   CREATE SUMMARY
========================================= */

function createTomorrowSummary() {

  const stats =
    getTomorrowStats();


  return `
    <div class="tomorrow-summary-grid">

      <article class="tomorrow-summary-card">

        <span>
          Tomorrow's items
        </span>

        <strong>
          ${stats.total}
        </strong>

        <small>
          ${
            stats.total === 0
              ? 'Nothing planned yet'
              : stats.total === 1
                ? '1 item for tomorrow'
                : `${stats.total} items for tomorrow`
          }
        </small>

      </article>


      <article class="tomorrow-summary-card">

        <span>
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
                ? '1 item still needs attention'
                : `${stats.open} items still need attention`
          }
        </small>

      </article>


      <article class="tomorrow-summary-card">

        <span>
          Ready
        </span>

        <strong>
          ${stats.completed}
        </strong>

        <small>
          ${
            stats.completed === 0
              ? 'Nothing checked off yet'
              : stats.completed === 1
                ? '1 item prepared'
                : `${stats.completed} items prepared`
          }
        </small>

      </article>


      <article class="tomorrow-summary-card">

        <span>
          Children planned
        </span>

        <strong>
          ${stats.childrenPlanned}
        </strong>

        <small>
          ${
            stats.childrenPlanned === 0
              ? 'No child plans yet'
              : stats.childrenPlanned === 1
                ? '1 child has plans'
                : `${stats.childrenPlanned} children have plans`
          }
        </small>

      </article>

    </div>
  `;

}


/* =========================================
   CHILD FILTER
========================================= */

function createTomorrowChildFilter() {

  return `
    <label class="tomorrow-child-filter">

      <span>
        Prepare for
      </span>


      <select
        id="tomorrowChildFilter"
        aria-label="Filter tomorrow preparation by child"
      >

        <option
          value="all"
          ${
            activeTomorrowChildFilter
            === 'all'
              ? 'selected'
              : ''
          }
        >
          All children
        </option>


        ${tomorrowChildren
          .map(
            (child) => {

              const id =
                escapeTomorrowHtml(
                  child?.id || ''
                );


              const name =
                escapeTomorrowHtml(
                  child?.name || 'Child'
                );


              const selected =
                activeTomorrowChildFilter
                === child?.id
                  ? 'selected'
                  : '';


              return `
                <option
                  value="${id}"
                  ${selected}
                >
                  ${name}
                </option>
              `;

            }
          )
          .join('')}

      </select>

    </label>
  `;

}


/* =========================================
   READINESS BANNER
========================================= */

function createTomorrowReadinessBanner() {

  const stats =
    getTomorrowStats();


  let title =
    'Tomorrow is clear';


  let message =
    'Nothing has been scheduled for tomorrow yet.';


  if (
    stats.total > 0
    && stats.progress === 100
  ) {

    title =
      'Everything is ready';

    message =
      'Every item planned for tomorrow has been checked off.';

  } else if (
    stats.total > 0
    && stats.progress >= 50
  ) {

    title =
      'Nearly there';

    message =
      `${stats.completed} of ${stats.total} items are already prepared.`;

  } else if (
    stats.total > 0
  ) {

    title =
      'A little preparation now';

    message =
      `${stats.open} item${
        stats.open === 1
          ? ''
          : 's'
      } still need attention before tomorrow.`;

  }


  return `
    <section class="tomorrow-readiness-banner">

      <div class="tomorrow-readiness-icon">
        ${icons.tomorrow}
      </div>


      <div class="tomorrow-readiness-content">

        <span>
          Evening readiness
        </span>

        <h2>
          ${title}
        </h2>

        <p>
          ${message}
        </p>

      </div>


      <div class="tomorrow-readiness-progress">

        <div class="tomorrow-readiness-progress-top">

          <span>
            Ready
          </span>

          <strong>
            ${stats.progress}%
          </strong>

        </div>


        <div class="tomorrow-readiness-track">

          <span
            class="tomorrow-readiness-fill"
            style="width: ${stats.progress}%"
          ></span>

        </div>

      </div>

    </section>
  `;

}


/* =========================================
   CREATE TASK CARD
========================================= */

function createTomorrowTaskCard(
  task
) {

  const id =
    escapeTomorrowHtml(
      task?.id || ''
    );


  const title =
    escapeTomorrowHtml(
      task?.title
      || 'Untitled item'
    );


  const notes =
    escapeTomorrowHtml(
      task?.notes || ''
    );


  const category =
    getSafeTomorrowTaskCategory(
      task?.category
    );


  const categoryLabel =
    escapeTomorrowHtml(
      getTomorrowTaskCategoryLabel(
        category
      )
    );


  const time =
    formatTomorrowTaskTime(
      task?.dueTime || ''
    );


  const completed =
    Boolean(
      task?.completed
    );


  const isPending =
    pendingTomorrowTaskIds.has(
      task?.id
    );


  return `
    <article
      class="
        tomorrow-task-card
        ${completed ? 'is-completed' : ''}
        ${isPending ? 'is-busy' : ''}
      "
      data-tomorrow-task-id="${id}"
    >

      <button
        type="button"
        class="
          tomorrow-task-complete-button
          ${completed ? 'is-completed' : ''}
        "
        data-tomorrow-toggle-task="${id}"
        aria-label="${
          completed
            ? `Mark ${title} as not ready`
            : `Mark ${title} as ready`
        }"
        ${isPending ? 'disabled' : ''}
      >

        ${
          completed
            ? icons.check
            : ''
        }

      </button>


      <div class="tomorrow-task-main">

        <div class="tomorrow-task-heading">

          <h3>
            ${title}
          </h3>


          <span
            class="
              tomorrow-task-category
              tomorrow-task-category-${category}
            "
          >
            ${categoryLabel}
          </span>

        </div>


        ${
          notes
            ? `
              <p class="tomorrow-task-notes">
                ${notes}
              </p>
            `
            : ''
        }


        <div class="tomorrow-task-meta">

          <span>
            ${
              time
                ? escapeTomorrowHtml(
                    time
                  )
                : 'Anytime tomorrow'
            }
          </span>

        </div>

      </div>

    </article>
  `;

}


/* =========================================
   CREATE CHILD GROUP
========================================= */

function createTomorrowChildGroup(
  child,
  tasks
) {

  const childName =
    escapeTomorrowHtml(
      child?.name || 'Child'
    );


  const childId =
    escapeTomorrowHtml(
      child?.id || ''
    );


  const colour =
    getSafeTomorrowChildColour(
      child?.colour
    );


  const initial =
    escapeTomorrowHtml(
      getTomorrowChildInitial(
        child?.name
      )
    );


  const completedCount =
    tasks.filter(
      (task) =>
        task.completed
    ).length;


  const openCount =
    tasks.length
    - completedCount;


  return `
    <section
      class="tomorrow-child-group"
      data-tomorrow-child-group="${childId}"
    >

      <div class="tomorrow-child-group-header">

        <button
          type="button"
          class="tomorrow-child-profile-button"
          data-tomorrow-open-child="${childId}"
        >

          <span
            class="
              tomorrow-child-avatar
              tomorrow-child-avatar-${colour}
            "
          >
            ${initial}
          </span>


          <span class="tomorrow-child-profile-copy">

            <small>
              Preparing for
            </small>

            <strong>
              ${childName}
            </strong>

          </span>


          <span class="tomorrow-child-profile-arrow">
            ${icons.arrow}
          </span>

        </button>


        <div class="tomorrow-child-group-stats">

          <span>
            ${tasks.length}
            ${
              tasks.length === 1
                ? 'item'
                : 'items'
            }
          </span>

          <span>
            ${openCount}
            open
          </span>

          <span>
            ${completedCount}
            ready
          </span>

        </div>

      </div>


      <div class="tomorrow-task-list">

        ${tasks
          .map(
            (task) =>
              createTomorrowTaskCard(
                task
              )
          )
          .join('')}

      </div>

    </section>
  `;

}


/* =========================================
   CREATE GROUPED TASKS
========================================= */

function createTomorrowGroups() {

  const tasks =
    sortTomorrowTasks(
      getFilteredTomorrowTasks()
    );


  if (!tasks.length) {

    return createTomorrowEmptyState();

  }


  const groups =
    new Map();


  tasks.forEach(
    (task) => {

      const childId =
        task.childId || 'unknown';


      if (
        !groups.has(
          childId
        )
      ) {

        groups.set(
          childId,
          []
        );

      }


      groups
        .get(childId)
        .push(task);

    }
  );


  return `
    <div class="tomorrow-groups">

      ${Array.from(
        groups.entries()
      )
        .map(
          (
            [
              childId,
              childTasks
            ]
          ) => {

            const child =
              getTomorrowChildById(
                childId
              );


            /*
              A task should normally always
              belong to a real child.

              If the child document was somehow
              removed, we still keep the task
              visible rather than silently hiding it.
            */

            const safeChild =
              child || {
                id:
                  childId,

                name:
                  'Child',

                colour:
                  'green'
              };


            return createTomorrowChildGroup(
              safeChild,
              childTasks
            );

          }
        )
        .join('')}

    </div>
  `;

}


/* =========================================
   EMPTY STATE
========================================= */

function createTomorrowEmptyState() {

  return `
    <div class="tomorrow-empty-state">

      <div class="tomorrow-empty-icon">
        ${icons.empty}
      </div>


      <span>
        Nothing planned yet
      </span>


      <h2>
        Tomorrow is clear
      </h2>


      <p>
        Add school preparation, homework, reminders,
        appointments or anything else your children
        need for tomorrow.
      </p>


      <button
        type="button"
        class="children-primary-button"
        id="tomorrowEmptyAddTaskButton"
      >

        ${icons.plus}

        <span>
          Add something for tomorrow
        </span>

      </button>

    </div>
  `;

}


/* =========================================
   CREATE COMPLETE VIEW
========================================= */

export function createTomorrowView() {

  return `
    <section
      class="app-view tomorrow-view"
      data-app-view="tomorrow"
      hidden
    >

      <!-- =====================================
           PAGE HEADER
      ====================================== -->

      <div class="tomorrow-page-header">

        <div>

          <span class="tomorrow-page-eyebrow">
            Prepare ahead
          </span>


          <h1>
            Prepare for Tomorrow
          </h1>


          <p>
            One calm place to see what every child
            needs before the next day begins.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="tomorrowHeaderAddTaskButton"
        >

          ${icons.plus}

          <span>
            Add for tomorrow
          </span>

        </button>

      </div>


      <!-- =====================================
           DATE + FILTER BAR
      ====================================== -->

      <div class="tomorrow-control-bar">

        <div class="tomorrow-date-details">

          <div class="tomorrow-date-icon">
            ${icons.calendar}
          </div>


          <div>

            <span>
              Tomorrow
            </span>

            <strong>
              ${getTomorrowDateLabel()}
            </strong>

          </div>

        </div>


        <div id="tomorrowChildFilterContainer">
          ${createTomorrowChildFilter()}
        </div>

      </div>


      <!-- =====================================
           SUMMARY
      ====================================== -->

      <div id="tomorrowSummaryContainer">
        ${createTomorrowSummary()}
      </div>


      <!-- =====================================
           READINESS
      ====================================== -->

      <div id="tomorrowReadinessContainer">
        ${createTomorrowReadinessBanner()}
      </div>


      <!-- =====================================
           PREPARATION WORKSPACE
      ====================================== -->

      <section class="tomorrow-workspace">

        <div class="tomorrow-workspace-header">

          <div>

            <span class="tomorrow-workspace-eyebrow">
              Evening preparation
            </span>


            <h2>
              What needs to be ready
            </h2>


            <p>
              Review everything due tomorrow,
              child by child, and check items off
              as they are prepared.
            </p>

          </div>

        </div>


        <div
          class="tomorrow-groups-container"
          id="tomorrowGroupsContainer"
        >
          ${createTomorrowGroups()}
        </div>

      </section>

    </section>
  `;

}


/* =========================================
   REFRESH CHILD FILTER
========================================= */

function refreshTomorrowChildFilter() {

  const container =
    document.querySelector(
      '#tomorrowChildFilterContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createTomorrowChildFilter();

}


/* =========================================
   REFRESH SUMMARY
========================================= */

function refreshTomorrowSummary() {

  const container =
    document.querySelector(
      '#tomorrowSummaryContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createTomorrowSummary();

}


/* =========================================
   REFRESH READINESS
========================================= */

function refreshTomorrowReadiness() {

  const container =
    document.querySelector(
      '#tomorrowReadinessContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createTomorrowReadinessBanner();

}


/* =========================================
   REFRESH GROUPS
========================================= */

function refreshTomorrowGroups() {

  const container =
    document.querySelector(
      '#tomorrowGroupsContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createTomorrowGroups();

}


/* =========================================
   REFRESH COMPLETE VIEW
========================================= */

function refreshTomorrowView() {

  refreshTomorrowChildFilter();

  refreshTomorrowSummary();

  refreshTomorrowReadiness();

  refreshTomorrowGroups();

  attachDynamicTomorrowListeners();

}


/* =========================================
   UPDATE TASK DATA
========================================= */

function updateTomorrowTasks(
  tasks = []
) {

  const tomorrowDate =
    getTomorrowDateString();


  const safeTasks =
    Array.isArray(tasks)
      ? tasks
      : [];


  tomorrowTasks =
    sortTomorrowTasks(
      safeTasks.filter(
        (task) =>
          task.dueDate
          === tomorrowDate
      )
    );


  refreshTomorrowView();

}


/* =========================================
   UPDATE CHILDREN DATA
========================================= */

function updateTomorrowChildren(
  children = []
) {

  tomorrowChildren =
    Array.isArray(children)
      ? children.map(
          (child) => ({
            ...child
          })
        )
      : [];


  /*
    Return safely to All children if
    the selected child was deleted.
  */

  if (
    activeTomorrowChildFilter
    !== 'all'
    && !tomorrowChildren.some(
      (child) =>
        child.id
        === activeTomorrowChildFilter
    )
  ) {

    activeTomorrowChildFilter =
      'all';

  }


  refreshTomorrowView();

}


/* =========================================
   CHANGE CHILD FILTER
========================================= */

function changeTomorrowChildFilter(
  childId
) {

  const validChild =
    childId === 'all'
    || tomorrowChildren.some(
      (child) =>
        child.id === childId
    );


  if (!validChild) {
    return;
  }


  activeTomorrowChildFilter =
    childId;


  refreshTomorrowView();

}


/* =========================================
   TOGGLE TASK COMPLETION
========================================= */

async function handleTomorrowTaskToggle(
  taskId
) {

  if (
    !taskId
    || pendingTomorrowTaskIds.has(
      taskId
    )
  ) {
    return;
  }


  const task =
    tomorrowTasks.find(
      (item) =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  try {

    pendingTomorrowTaskIds.add(
      taskId
    );


    refreshTomorrowView();


    await toggleTaskCompletion(
      task.id,
      !task.completed
    );

  } catch (error) {

    console.error(
      'Failed to update tomorrow item:',
      error
    );

  } finally {

    pendingTomorrowTaskIds.delete(
      taskId
    );


    refreshTomorrowView();

  }

}


/* =========================================
   ADD TASK ACTION
========================================= */

function handleTomorrowAddTask() {

  if (
    typeof tomorrowCallbacks.onAddTask
    !== 'function'
  ) {
    return;
  }


  tomorrowCallbacks.onAddTask({

    defaultDueDate:
      getTomorrowDateString()

  });

}


/* =========================================
   OPEN CHILD ACTION
========================================= */

function handleTomorrowOpenChild(
  childId
) {

  if (!childId) {
    return;
  }


  if (
    typeof tomorrowCallbacks.onOpenChild
    !== 'function'
  ) {
    return;
  }


  tomorrowCallbacks.onOpenChild(
    childId
  );

}


/* =========================================
   DYNAMIC LISTENERS
========================================= */

function attachDynamicTomorrowListeners() {

  /* -----------------------------------------
     CHILD FILTER
  ----------------------------------------- */

  document
    .querySelector(
      '#tomorrowChildFilter'
    )
    ?.addEventListener(
      'change',
      (event) => {

        changeTomorrowChildFilter(
          event.currentTarget.value
        );

      }
    );


  /* -----------------------------------------
     TASK COMPLETION
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-tomorrow-toggle-task]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handleTomorrowTaskToggle(
            button.dataset
              .tomorrowToggleTask
          );

        }
      );

    });


  /* -----------------------------------------
     OPEN CHILD
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-tomorrow-open-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handleTomorrowOpenChild(
            button.dataset
              .tomorrowOpenChild
          );

        }
      );

    });


  /* -----------------------------------------
     EMPTY STATE ADD TASK
  ----------------------------------------- */

  document
    .querySelector(
      '#tomorrowEmptyAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handleTomorrowAddTask
    );

}


/* =========================================
   INITIALISE TOMORROW VIEW
========================================= */

export function initialiseTomorrowView({
  onAddTask = null,
  onOpenChild = null
} = {}) {

  /*
    Save callbacks supplied by app.js.

    This keeps the feature independent
    from app navigation and modal logic.
  */

  tomorrowCallbacks = {

    onAddTask:
      typeof onAddTask === 'function'
        ? onAddTask
        : null,

    onOpenChild:
      typeof onOpenChild === 'function'
        ? onOpenChild
        : null

  };


  activeTomorrowChildFilter =
    'all';


  pendingTomorrowTaskIds =
    new Set();


  /*
    Seed immediately from current data.
  */

  updateTomorrowChildren(
    getChildrenData()
  );


  updateTomorrowTasks(
    getTasks()
  );


  /*
    Permanent header button.
  */

  document
    .querySelector(
      '#tomorrowHeaderAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handleTomorrowAddTask
    );


  /*
    Prevent duplicate global event
    listeners if the app gets rendered again.
  */

  if (
    tomorrowTasksUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:tasks-updated',
      tomorrowTasksUpdatedHandler
    );

  }


  if (
    tomorrowChildrenUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:children-updated',
      tomorrowChildrenUpdatedHandler
    );

  }


  tomorrowTasksUpdatedHandler =
    (event) => {

      updateTomorrowTasks(
        event.detail?.tasks || []
      );

    };


  tomorrowChildrenUpdatedHandler =
    (event) => {

      updateTomorrowChildren(
        event.detail?.children || []
      );

    };


  window.addEventListener(
    'familyflow:tasks-updated',
    tomorrowTasksUpdatedHandler
  );


  window.addEventListener(
    'familyflow:children-updated',
    tomorrowChildrenUpdatedHandler
  );


  attachDynamicTomorrowListeners();

}


/* =========================================
   PUBLIC REFRESH
========================================= */

export function refreshTomorrowViewData() {

  updateTomorrowChildren(
    getChildrenData()
  );


  updateTomorrowTasks(
    getTasks()
  );

}