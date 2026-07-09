
import './planner.css';
import {
  getTasks,
  toggleTaskCompletion
} from './tasks.js';

import {
  getChildrenData
} from './children.js';


/* =========================================
   FAMILYFLOW — PLANNER VIEW
========================================= */


/* =========================================
   MODULE STATE
========================================= */

const now =
  new Date();


let plannerYear =
  now.getFullYear();


let plannerMonth =
  now.getMonth();


let selectedPlannerDate =
  createDateString(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );


let plannerTasks =
  [];


let plannerChildren =
  [];


let activePlannerChildFilter =
  'all';


let pendingPlannerTaskIds =
  new Set();


let plannerTasksUpdatedHandler =
  null;


let plannerChildrenUpdatedHandler =
  null;


let plannerCallbacks = {

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


  previous: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m15 18-6-6 6-6"></path>
    </svg>
  `,


  next: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="m9 18 6-6-6-6"></path>
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


  empty: `
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

      <path d="M8 9h8"></path>
      <path d="M8 13h5"></path>
    </svg>
  `

};


/* =========================================
   BASIC HELPERS
========================================= */

function escapePlannerHtml(
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
  year,
  monthIndex,
  day
) {

  const month =
    String(
      monthIndex + 1
    ).padStart(2, '0');


  const dayValue =
    String(day)
      .padStart(2, '0');


  return `${year}-${month}-${dayValue}`;

}


function getTodayDateStringLocal() {

  const date =
    new Date();


  return createDateString(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );

}


function parseDateString(
  dateValue = ''
) {

  const parts =
    String(dateValue)
      .split('-')
      .map(Number);


  if (
    parts.length !== 3
    || parts.some(Number.isNaN)
  ) {
    return null;
  }


  const [
    year,
    month,
    day
  ] = parts;


  return new Date(
    year,
    month - 1,
    day
  );

}


function formatPlannerMonthHeading() {

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      month:
        'long',

      year:
        'numeric'
    }
  ).format(
    new Date(
      plannerYear,
      plannerMonth,
      1
    )
  );

}


function formatPlannerSelectedDate(
  dateValue
) {

  const date =
    parseDateString(
      dateValue
    );


  if (!date) {
    return 'Selected day';
  }


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
  ).format(date);

}


function formatPlannerShortDate(
  dateValue
) {

  const date =
    parseDateString(
      dateValue
    );


  if (!date) {
    return dateValue;
  }


  return new Intl.DateTimeFormat(
    'en-GB',
    {
      weekday:
        'short',

      day:
        'numeric',

      month:
        'short'
    }
  ).format(date);

}


/* =========================================
   CHILD HELPERS
========================================= */

function getPlannerChildById(
  childId = ''
) {

  return plannerChildren.find(
    (child) =>
      child.id === childId
  ) || null;

}


function getPlannerChildInitial(
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


function getSafePlannerChildColour(
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

function getPlannerTaskCategoryLabel(
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


function getSafePlannerTaskCategory(
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

function formatPlannerTaskTime(
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
   FILTER TASKS
========================================= */

function getFilteredPlannerTasks() {

  if (
    activePlannerChildFilter
    === 'all'
  ) {

    return [
      ...plannerTasks
    ];

  }


  return plannerTasks.filter(
    (task) =>
      task.childId
      === activePlannerChildFilter
  );

}


/* =========================================
   MONTH TASKS
========================================= */

function getPlannerMonthTasks() {

  const monthPrefix =
    `${plannerYear}-${String(
      plannerMonth + 1
    ).padStart(2, '0')}-`;


  return getFilteredPlannerTasks()
    .filter(
      (task) =>
        task.dueDate
        && task.dueDate.startsWith(
          monthPrefix
        )
    );

}


/* =========================================
   TASKS FOR DATE
========================================= */

function getPlannerTasksForDate(
  dateValue
) {

  return getFilteredPlannerTasks()
    .filter(
      (task) =>
        task.dueDate === dateValue
    )
    .sort(
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
          Earlier times first.
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
   MONTH STATISTICS
========================================= */

function getPlannerMonthStats() {

  const monthTasks =
    getPlannerMonthTasks();


  const total =
    monthTasks.length;


  const completed =
    monthTasks.filter(
      (task) =>
        task.completed
    ).length;


  const open =
    total
    - completed;


  const activeDays =
    new Set(
      monthTasks
        .map(
          (task) =>
            task.dueDate
        )
        .filter(Boolean)
    ).size;


  return {

    total,

    open,

    completed,

    activeDays

  };

}


/* =========================================
   CREATE PLANNER SUMMARY
========================================= */

function createPlannerSummary() {

  const stats =
    getPlannerMonthStats();


  return `
    <div class="planner-summary-grid">

      <article class="planner-summary-card">

        <span>
          Total tasks
        </span>

        <strong>
          ${stats.total}
        </strong>

        <small>
          ${
            stats.total === 1
              ? '1 task this month'
              : `${stats.total} tasks this month`
          }
        </small>

      </article>


      <article class="planner-summary-card">

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
                ? '1 task needs attention'
                : `${stats.open} tasks need attention`
          }
        </small>

      </article>


      <article class="planner-summary-card">

        <span>
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


      <article class="planner-summary-card">

        <span>
          Active days
        </span>

        <strong>
          ${stats.activeDays}
        </strong>

        <small>
          ${
            stats.activeDays === 0
              ? 'No scheduled days yet'
              : stats.activeDays === 1
                ? '1 scheduled day'
                : `${stats.activeDays} scheduled days`
          }
        </small>

      </article>

    </div>
  `;

}


/* =========================================
   CREATE CHILD FILTER
========================================= */

function createPlannerChildFilter() {

  return `
    <label class="planner-child-filter">

      <span>
        Show tasks for
      </span>


      <select
        id="plannerChildFilter"
        aria-label="Filter planner by child"
      >

        <option
          value="all"
          ${
            activePlannerChildFilter
            === 'all'
              ? 'selected'
              : ''
          }
        >
          All children
        </option>


        ${plannerChildren
          .map(
            (child) => {

              const id =
                escapePlannerHtml(
                  child?.id || ''
                );


              const name =
                escapePlannerHtml(
                  child?.name || 'Child'
                );


              const selected =
                activePlannerChildFilter
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
   CALENDAR WEEKDAY HEADINGS
========================================= */

function createPlannerWeekdays() {

  const weekdays = [
    'Mon',
    'Tue',
    'Wed',
    'Thu',
    'Fri',
    'Sat',
    'Sun'
  ];


  return `
    <div class="planner-weekdays">

      ${weekdays
        .map(
          (day) => `
            <span>
              ${day}
            </span>
          `
        )
        .join('')}

    </div>
  `;

}


/* =========================================
   CALENDAR CELLS
========================================= */

function createPlannerCalendarDays() {

  const firstDayOfMonth =
    new Date(
      plannerYear,
      plannerMonth,
      1
    );


  /*
    Convert JavaScript Sunday-first index
    into Monday-first calendar index.

    Sunday 0 becomes 6.
    Monday 1 becomes 0.
  */

  const startOffset =
    (
      firstDayOfMonth.getDay()
      + 6
    ) % 7;


  const calendarStart =
    new Date(
      plannerYear,
      plannerMonth,
      1 - startOffset
    );


  const today =
    getTodayDateStringLocal();


  const cells =
    [];


  /*
    Always render 42 cells:
    6 rows × 7 days.

    This keeps the calendar height stable.
  */

  for (
    let index = 0;
    index < 42;
    index += 1
  ) {

    const date =
      new Date(
        calendarStart
      );


    date.setDate(
      calendarStart.getDate()
      + index
    );


    const dateString =
      createDateString(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );


    const dayTasks =
      getPlannerTasksForDate(
        dateString
      );


    const visibleTasks =
      dayTasks.slice(
        0,
        2
      );


    const extraTaskCount =
      Math.max(
        0,
        dayTasks.length - 2
      );


    const isCurrentMonth =
      date.getMonth()
        === plannerMonth
      && date.getFullYear()
        === plannerYear;


    const isToday =
      dateString === today;


    const isSelected =
      dateString
        === selectedPlannerDate;


    cells.push(`
      <button
        type="button"
        class="
          planner-day-cell
          ${
            isCurrentMonth
              ? ''
              : 'is-outside-month'
          }
          ${
            isToday
              ? 'is-today'
              : ''
          }
          ${
            isSelected
              ? 'is-selected'
              : ''
          }
          ${
            dayTasks.length
              ? 'has-tasks'
              : ''
          }
        "
        data-planner-date="${dateString}"
        aria-label="${escapePlannerHtml(
          formatPlannerSelectedDate(
            dateString
          )
        )}, ${dayTasks.length} task${
          dayTasks.length === 1
            ? ''
            : 's'
        }"
      >

        <span class="planner-day-number">
          ${date.getDate()}
        </span>


        <span class="planner-day-task-preview">

          ${visibleTasks
            .map(
              (task) => {

                const child =
                  getPlannerChildById(
                    task.childId
                  );


                const colour =
                  getSafePlannerChildColour(
                    child?.colour
                  );


                return `
                  <span
                    class="
                      planner-day-task-dot
                      planner-day-task-dot-${colour}
                      ${
                        task.completed
                          ? 'is-completed'
                          : ''
                      }
                    "
                    title="${escapePlannerHtml(
                      task.title || 'Task'
                    )}"
                  ></span>
                `;

              }
            )
            .join('')}


          ${
            extraTaskCount > 0
              ? `
                <small>
                  +${extraTaskCount}
                </small>
              `
              : ''
          }

        </span>

      </button>
    `);

  }


  return `
    <div class="planner-calendar-grid">
      ${cells.join('')}
    </div>
  `;

}


/* =========================================
   CREATE COMPLETE CALENDAR
========================================= */

function createPlannerCalendar() {

  return `
    <section class="planner-calendar-panel">

      <div class="planner-calendar-toolbar">

        <div class="planner-month-navigation">

          <button
            type="button"
            class="planner-month-arrow"
            id="plannerPreviousMonthButton"
            aria-label="Previous month"
          >
            ${icons.previous}
          </button>


          <div class="planner-month-heading">

            <span>
              Family calendar
            </span>

            <h2>
              ${formatPlannerMonthHeading()}
            </h2>

          </div>


          <button
            type="button"
            class="planner-month-arrow"
            id="plannerNextMonthButton"
            aria-label="Next month"
          >
            ${icons.next}
          </button>

        </div>


        <button
          type="button"
          class="planner-today-button"
          id="plannerTodayButton"
        >
          Today
        </button>

      </div>


      ${createPlannerWeekdays()}


      ${createPlannerCalendarDays()}

    </section>
  `;

}


/* =========================================
   CREATE SELECTED-DAY TASK CARD
========================================= */

function createPlannerTaskCard(
  task
) {

  const id =
    escapePlannerHtml(
      task?.id || ''
    );


  const title =
    escapePlannerHtml(
      task?.title
      || 'Untitled task'
    );


  const notes =
    escapePlannerHtml(
      task?.notes || ''
    );


  const child =
    getPlannerChildById(
      task?.childId || ''
    );


  const childName =
    escapePlannerHtml(
      child?.name || 'Child'
    );


  const childColour =
    getSafePlannerChildColour(
      child?.colour
    );


  const childInitial =
    escapePlannerHtml(
      getPlannerChildInitial(
        child?.name
      )
    );


  const category =
    getSafePlannerTaskCategory(
      task?.category
    );


  const categoryLabel =
    escapePlannerHtml(
      getPlannerTaskCategoryLabel(
        category
      )
    );


  const time =
    formatPlannerTaskTime(
      task?.dueTime || ''
    );


  const completed =
    Boolean(
      task?.completed
    );


  const isPending =
    pendingPlannerTaskIds.has(
      task?.id
    );


  return `
    <article
      class="
        planner-task-card
        ${completed ? 'is-completed' : ''}
        ${isPending ? 'is-busy' : ''}
      "
      data-planner-task-id="${id}"
    >

      <button
        type="button"
        class="
          planner-task-complete-button
          ${completed ? 'is-completed' : ''}
        "
        data-planner-toggle-task="${id}"
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


      <div class="planner-task-main">

        <div class="planner-task-heading">

          <h3>
            ${title}
          </h3>


          <span
            class="
              planner-task-category
              planner-task-category-${category}
            "
          >
            ${categoryLabel}
          </span>

        </div>


        ${
          notes
            ? `
              <p class="planner-task-notes">
                ${notes}
              </p>
            `
            : ''
        }


        <div class="planner-task-meta">

          <span>
            ${
              time
                ? escapePlannerHtml(
                    time
                  )
                : 'Anytime'
            }
          </span>

        </div>

      </div>


      <button
        type="button"
        class="planner-task-child"
        data-planner-open-child="${escapePlannerHtml(
          task?.childId || ''
        )}"
        aria-label="Open ${childName}'s profile"
      >

        <span
          class="
            planner-task-child-avatar
            planner-task-child-avatar-${childColour}
          "
        >
          ${childInitial}
        </span>


        <span class="planner-task-child-details">

          <small>
            For
          </small>

          <strong>
            ${childName}
          </strong>

        </span>


        <span class="planner-task-child-arrow">
          ${icons.arrow}
        </span>

      </button>

    </article>
  `;

}


/* =========================================
   SELECTED DAY EMPTY STATE
========================================= */

function createPlannerSelectedDayEmptyState() {

  return `
    <div class="planner-day-empty-state">

      <div class="planner-day-empty-icon">
        ${icons.empty}
      </div>


      <span>
        Nothing scheduled
      </span>


      <h3>
        This day is clear
      </h3>


      <p>
        Add a task for this date and it will appear here automatically.
      </p>


      <button
        type="button"
        class="children-primary-button"
        id="plannerEmptyAddTaskButton"
      >
        ${icons.plus}

        <span>
          Add task for this day
        </span>
      </button>

    </div>
  `;

}


/* =========================================
   CREATE SELECTED DAY PANEL
========================================= */

function createPlannerSelectedDayPanel() {

  const selectedTasks =
    getPlannerTasksForDate(
      selectedPlannerDate
    );


  const completedCount =
    selectedTasks.filter(
      (task) =>
        task.completed
    ).length;


  const openCount =
    selectedTasks.length
    - completedCount;


  return `
    <section class="planner-day-panel">

      <div class="planner-day-panel-header">

        <div>

          <span class="planner-day-panel-eyebrow">
            Selected day
          </span>


          <h2>
            ${escapePlannerHtml(
              formatPlannerSelectedDate(
                selectedPlannerDate
              )
            )}
          </h2>


          <p>
            ${
              selectedTasks.length === 0
                ? 'Nothing is scheduled for this day.'
                : `${selectedTasks.length} task${
                    selectedTasks.length === 1
                      ? ''
                      : 's'
                  } scheduled · ${openCount} open · ${completedCount} completed`
            }
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="plannerAddTaskButton"
        >
          ${icons.plus}

          <span>
            Add task
          </span>
        </button>

      </div>


      <div class="planner-selected-date-badge">

        <div class="planner-selected-date-icon">
          ${icons.calendar}
        </div>


        <div>

          <span>
            Selected date
          </span>

          <strong>
            ${escapePlannerHtml(
              formatPlannerShortDate(
                selectedPlannerDate
              )
            )}
          </strong>

        </div>

      </div>


      <div
        class="planner-day-task-container"
        id="plannerDayTaskContainer"
      >

        ${
          selectedTasks.length
            ? `
              <div class="planner-task-list">

                ${selectedTasks
                  .map(
                    (task) =>
                      createPlannerTaskCard(
                        task
                      )
                  )
                  .join('')}

              </div>
            `
            : createPlannerSelectedDayEmptyState()
        }

      </div>

    </section>
  `;

}


/* =========================================
   COMPLETE PLANNER VIEW
========================================= */

export function createPlannerView() {

  return `
    <section
      class="app-view planner-view"
      data-app-view="planner"
      hidden
    >

      <!-- =====================================
           PAGE HEADER
      ====================================== -->

      <div class="planner-page-header">

        <div>

          <span class="planner-page-eyebrow">
            Family calendar
          </span>


          <h1>
            Planner
          </h1>


          <p>
            See every dated task across your family and stay ahead of what's coming next.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="plannerHeaderAddTaskButton"
        >
          ${icons.plus}

          <span>
            Add task
          </span>
        </button>

      </div>


      <!-- =====================================
           CONTROLS
      ====================================== -->

      <div class="planner-control-bar">

        <div>

          <span class="planner-control-eyebrow">
            Viewing
          </span>

          <strong>
            ${formatPlannerMonthHeading()}
          </strong>

        </div>


        <div id="plannerChildFilterContainer">
          ${createPlannerChildFilter()}
        </div>

      </div>


      <!-- =====================================
           SUMMARY
      ====================================== -->

      <div id="plannerSummaryContainer">
        ${createPlannerSummary()}
      </div>


      <!-- =====================================
           MAIN LAYOUT
      ====================================== -->

      <div class="planner-layout">

        <div id="plannerCalendarContainer">
          ${createPlannerCalendar()}
        </div>


        <div id="plannerSelectedDayContainer">
          ${createPlannerSelectedDayPanel()}
        </div>

      </div>

    </section>
  `;

}


/* =========================================
   REFRESH SUMMARY
========================================= */

function refreshPlannerSummary() {

  const container =
    document.querySelector(
      '#plannerSummaryContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createPlannerSummary();

}


/* =========================================
   REFRESH FILTER
========================================= */

function refreshPlannerChildFilter() {

  const container =
    document.querySelector(
      '#plannerChildFilterContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createPlannerChildFilter();

}


/* =========================================
   REFRESH CALENDAR
========================================= */

function refreshPlannerCalendar() {

  const container =
    document.querySelector(
      '#plannerCalendarContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createPlannerCalendar();

}


/* =========================================
   REFRESH SELECTED DAY
========================================= */

function refreshPlannerSelectedDay() {

  const container =
    document.querySelector(
      '#plannerSelectedDayContainer'
    );


  if (!container) {
    return;
  }


  container.innerHTML =
    createPlannerSelectedDayPanel();

}


/* =========================================
   REFRESH COMPLETE PLANNER
========================================= */

function refreshPlannerView() {

  refreshPlannerChildFilter();

  refreshPlannerSummary();

  refreshPlannerCalendar();

  refreshPlannerSelectedDay();

  attachDynamicPlannerListeners();

}


/* =========================================
   UPDATE TASK DATA
========================================= */

function updatePlannerTasks(
  tasks = []
) {

  plannerTasks =
    Array.isArray(tasks)
      ? tasks.map(
          (task) => ({
            ...task
          })
        )
      : [];


  refreshPlannerView();

}


/* =========================================
   UPDATE CHILDREN DATA
========================================= */

function updatePlannerChildren(
  children = []
) {

  plannerChildren =
    Array.isArray(children)
      ? children.map(
          (child) => ({
            ...child
          })
        )
      : [];


  /*
    If the selected child was deleted,
    safely return to All children.
  */

  if (
    activePlannerChildFilter
    !== 'all'
    && !plannerChildren.some(
      (child) =>
        child.id
        === activePlannerChildFilter
    )
  ) {

    activePlannerChildFilter =
      'all';

  }


  refreshPlannerView();

}


/* =========================================
   SELECT CALENDAR DAY
========================================= */

function selectPlannerDate(
  dateValue
) {

  const date =
    parseDateString(
      dateValue
    );


  if (!date) {
    return;
  }


  selectedPlannerDate =
    dateValue;


  /*
    Clicking an outside-month calendar cell
    also moves the planner into that month.
  */

  const clickedYear =
    date.getFullYear();


  const clickedMonth =
    date.getMonth();


  if (
    clickedYear !== plannerYear
    || clickedMonth !== plannerMonth
  ) {

    plannerYear =
      clickedYear;


    plannerMonth =
      clickedMonth;

  }


  refreshPlannerView();

}


/* =========================================
   CHANGE MONTH
========================================= */

function changePlannerMonth(
  offset
) {

  const newDate =
    new Date(
      plannerYear,
      plannerMonth + offset,
      1
    );


  plannerYear =
    newDate.getFullYear();


  plannerMonth =
    newDate.getMonth();


  selectedPlannerDate =
    createDateString(
      plannerYear,
      plannerMonth,
      1
    );


  refreshPlannerView();

}


/* =========================================
   RETURN TO TODAY
========================================= */

function goToPlannerToday() {

  const today =
    new Date();


  plannerYear =
    today.getFullYear();


  plannerMonth =
    today.getMonth();


  selectedPlannerDate =
    createDateString(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );


  refreshPlannerView();

}


/* =========================================
   CHANGE CHILD FILTER
========================================= */

function changePlannerChildFilter(
  childId
) {

  const validChild =
    childId === 'all'
    || plannerChildren.some(
      (child) =>
        child.id === childId
    );


  if (!validChild) {
    return;
  }


  activePlannerChildFilter =
    childId;


  refreshPlannerView();

}


/* =========================================
   TOGGLE TASK COMPLETION
========================================= */

async function handlePlannerTaskToggle(
  taskId
) {

  if (
    !taskId
    || pendingPlannerTaskIds.has(
      taskId
    )
  ) {
    return;
  }


  const task =
    plannerTasks.find(
      (item) =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  try {

    pendingPlannerTaskIds.add(
      taskId
    );


    refreshPlannerView();


    await toggleTaskCompletion(
      task.id,
      !task.completed
    );

  } catch (error) {

    console.error(
      'Failed to update task from Planner:',
      error
    );

  } finally {

    pendingPlannerTaskIds.delete(
      taskId
    );


    refreshPlannerView();

  }

}


/* =========================================
   ADD TASK ACTION
========================================= */

function handlePlannerAddTask() {

  if (
    typeof plannerCallbacks.onAddTask
    !== 'function'
  ) {
    return;
  }


  plannerCallbacks.onAddTask({

    defaultDueDate:
      selectedPlannerDate

  });

}


/* =========================================
   OPEN CHILD ACTION
========================================= */

function handlePlannerOpenChild(
  childId
) {

  if (!childId) {
    return;
  }


  if (
    typeof plannerCallbacks.onOpenChild
    !== 'function'
  ) {
    return;
  }


  plannerCallbacks.onOpenChild(
    childId
  );

}


/* =========================================
   DYNAMIC LISTENERS
========================================= */

function attachDynamicPlannerListeners() {

  /* -----------------------------------------
     CHILD FILTER
  ----------------------------------------- */

  document
    .querySelector(
      '#plannerChildFilter'
    )
    ?.addEventListener(
      'change',
      (event) => {

        changePlannerChildFilter(
          event.currentTarget.value
        );

      }
    );


  /* -----------------------------------------
     PREVIOUS MONTH
  ----------------------------------------- */

  document
    .querySelector(
      '#plannerPreviousMonthButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changePlannerMonth(
          -1
        );

      }
    );


  /* -----------------------------------------
     NEXT MONTH
  ----------------------------------------- */

  document
    .querySelector(
      '#plannerNextMonthButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changePlannerMonth(
          1
        );

      }
    );


  /* -----------------------------------------
     TODAY BUTTON
  ----------------------------------------- */

  document
    .querySelector(
      '#plannerTodayButton'
    )
    ?.addEventListener(
      'click',
      goToPlannerToday
    );


  /* -----------------------------------------
     CALENDAR DAY
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-planner-date]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          selectPlannerDate(
            button.dataset
              .plannerDate
          );

        }
      );

    });


  /* -----------------------------------------
     TASK COMPLETION
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-planner-toggle-task]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handlePlannerTaskToggle(
            button.dataset
              .plannerToggleTask
          );

        }
      );

    });


  /* -----------------------------------------
     OPEN CHILD
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-planner-open-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          handlePlannerOpenChild(
            button.dataset
              .plannerOpenChild
          );

        }
      );

    });


  /* -----------------------------------------
     SELECTED DAY ADD TASK
  ----------------------------------------- */

  document
    .querySelector(
      '#plannerAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handlePlannerAddTask
    );


  document
    .querySelector(
      '#plannerEmptyAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handlePlannerAddTask
    );

}


/* =========================================
   INITIALISE PLANNER VIEW
========================================= */

export function initialisePlannerView({
  onAddTask = null,
  onOpenChild = null
} = {}) {

  /*
    Save app-shell callbacks.

    Planner does not directly know about
    app.js navigation or the global modal.
  */

  plannerCallbacks = {

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
    Reset initial calendar to current date.
  */

  const today =
    new Date();


  plannerYear =
    today.getFullYear();


  plannerMonth =
    today.getMonth();


  selectedPlannerDate =
    createDateString(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );


  activePlannerChildFilter =
    'all';


  /*
    Seed from current in-memory data.
  */

  updatePlannerChildren(
    getChildrenData()
  );


  updatePlannerTasks(
    getTasks()
  );


  /*
    Header Add Task button is permanent
    and does not get replaced by dynamic
    refreshes.
  */

  document
    .querySelector(
      '#plannerHeaderAddTaskButton'
    )
    ?.addEventListener(
      'click',
      handlePlannerAddTask
    );


  /*
    Prevent duplicate global listeners if
    the entire app is rendered again.
  */

  if (
    plannerTasksUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:tasks-updated',
      plannerTasksUpdatedHandler
    );

  }


  if (
    plannerChildrenUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:children-updated',
      plannerChildrenUpdatedHandler
    );

  }


  plannerTasksUpdatedHandler =
    (event) => {

      updatePlannerTasks(
        event.detail?.tasks || []
      );

    };


  plannerChildrenUpdatedHandler =
    (event) => {

      updatePlannerChildren(
        event.detail?.children || []
      );

    };


  window.addEventListener(
    'familyflow:tasks-updated',
    plannerTasksUpdatedHandler
  );


  window.addEventListener(
    'familyflow:children-updated',
    plannerChildrenUpdatedHandler
  );


  attachDynamicPlannerListeners();

}


/* =========================================
   PUBLIC REFRESH
========================================= */

export function refreshPlannerViewData() {

  updatePlannerChildren(
    getChildrenData()
  );


  updatePlannerTasks(
    getTasks()
  );

}