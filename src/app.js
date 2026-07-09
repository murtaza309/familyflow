import './dashboard.css';
import familyFlowLogo from './assets/familyflow-logo.png';

import {
  createChildrenView,
  initialiseChildrenView,
  openChildProfileById
} from './children.js';

import {
  getTodayDateString,
  toggleTaskCompletion,
  createTask
} from './tasks.js';

import {
  createTodayView,
  initialiseTodayView
} from './today.js';

import {
  createPlannerView,
  initialisePlannerView
} from './planner.js';
import {
  createTomorrowView,
  initialiseTomorrowView
} from './tomorrow.js';

import {
  createProfilePanel,
  initialiseProfilePanel,
  openProfilePanel
} from './profile.js';


/* =========================================
   FAMILYFLOW — LOGGED-IN APP SHELL
========================================= */


/* =========================================
   ICONS
========================================= */

const icons = {

  dashboard: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="2"></rect>
      <rect x="14" y="3" width="7" height="7" rx="2"></rect>
      <rect x="3" y="14" width="7" height="7" rx="2"></rect>
      <rect x="14" y="14" width="7" height="7" rx="2"></rect>
    </svg>
  `,

  today: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="5" width="18" height="16" rx="3"></rect>
      <path d="M8 3v4"></path>
      <path d="M16 3v4"></path>
      <path d="M3 10h18"></path>
      <path d="m8 15 2 2 5-5"></path>
    </svg>
  `,

  children: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="9" cy="8" r="3"></circle>
      <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"></path>
      <circle cx="17" cy="9" r="2.5"></circle>
      <path d="M16 15c2.8 0 5 2 5 5"></path>
    </svg>
  `,

  planner: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <rect x="3" y="4" width="18" height="17" rx="3"></rect>
      <path d="M8 2v4"></path>
      <path d="M16 2v4"></path>
      <path d="M3 9h18"></path>
      <path d="M8 13h2"></path>
      <path d="M14 13h2"></path>
      <path d="M8 17h2"></path>
    </svg>
  `,

  tomorrow: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
      <path d="M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z"></path>
      <path d="M8 8h8"></path>
      <path d="M8 12h5"></path>
      <path d="m8 16 2 2 5-5"></path>
    </svg>
  `,

  plus: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round">
      <path d="M12 5v14"></path>
      <path d="M5 12h14"></path>
    </svg>
  `,

  arrow: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M5 12h14"></path>
      <path d="m14 7 5 5-5 5"></path>
    </svg>
  `,

  chevron: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="m9 18 6-6-6-6"></path>
    </svg>
  `,

  bell: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
      <path d="M10 21h4"></path>
    </svg>
  `,

  shield: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8">
      <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"></path>
      <path d="m9 12 2 2 4-4"></path>
    </svg>
  `,

  close: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M6 6l12 12"></path>
      <path d="M18 6 6 18"></path>
    </svg>
  `,

  task: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <rect x="4" y="4" width="16" height="16" rx="3"></rect>
      <path d="m8 12 2.5 2.5L16 9"></path>
    </svg>
  `

};


/* =========================================
   NAVIGATION CONFIGURATION
========================================= */

const navigationItems = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    mobileLabel: 'Home',
    icon: icons.dashboard
  },
  {
    id: 'today',
    label: 'Today',
    mobileLabel: 'Today',
    icon: icons.today
  },
  {
    id: 'children',
    label: 'Children',
    mobileLabel: 'Children',
    icon: icons.children
  },
  {
    id: 'planner',
    label: 'Planner',
    mobileLabel: 'Planner',
    icon: icons.planner
  },
  {
    id: 'tomorrow',
    label: 'Prepare for Tomorrow',
    mobileLabel: 'Tomorrow',
    icon: icons.tomorrow
  }
];


/* =========================================
   APP STATE
========================================= */

let currentView =
  'dashboard';


let dashboardChildren =
  [];


let dashboardTasks =
  [];


let dashboardTaskActionInProgress =
  false;


let globalTaskModalActionInProgress =
  false;


/* =========================================
   BASIC HELPERS
========================================= */

function escapeAppHtml(
  value = ''
) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function getTodayLabel() {

  return new Intl.DateTimeFormat(
    'en-GB',
    {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }
  ).format(
    new Date()
  );

}


function getGreeting() {

  const hour =
    new Date().getHours();


  if (hour < 12) {
    return 'Good morning';
  }


  if (hour < 18) {
    return 'Good afternoon';
  }


  return 'Good evening';

}


function getInitials(
  name = ''
) {

  const cleanName =
    String(name).trim();


  if (!cleanName) {
    return 'P';
  }


  return cleanName
    .split(/\s+/)
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join('');

}


function getDashboardChildInitial(
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


function getSafeDashboardChildColour(
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
   NAVIGATION HTML
========================================= */

function createDesktopNavigation() {

  return navigationItems
    .map((item) => {

      const isActive =
        item.id === currentView
          ? 'is-active'
          : '';


      return `
        <button
          type="button"
          class="app-nav-item ${isActive}"
          data-view="${item.id}"
          aria-label="${item.label}"
        >

          <span class="app-nav-icon">
            ${item.icon}
          </span>

          <span class="app-nav-label">
            ${item.label}
          </span>

        </button>
      `;

    })
    .join('');

}


function createMobileNavigation() {

  return navigationItems
    .map((item) => {

      const isActive =
        item.id === currentView
          ? 'is-active'
          : '';


      return `
        <button
          type="button"
          class="mobile-nav-item ${isActive}"
          data-view="${item.id}"
          aria-label="${item.label}"
        >

          <span class="mobile-nav-icon">
            ${item.icon}
          </span>

          <span class="mobile-nav-label">
            ${item.mobileLabel}
          </span>

        </button>
      `;

    })
    .join('');

}


/* =========================================
   DASHBOARD VIEW
========================================= */

function createDashboardView() {

  const now =
    new Date();


  const dateNumber =
    now.getDate();


  const monthLabel =
    new Intl.DateTimeFormat(
      'en-GB',
      {
        month: 'short'
      }
    ).format(now);


  return `
    <section
      class="app-view dashboard-view dashboard-redesign"
      data-app-view="dashboard"
    >


      <!-- =====================================
           DASHBOARD HERO
      ====================================== -->

      <section class="dashboard-hero">

        <div class="dashboard-hero-decoration"></div>


        <div class="dashboard-hero-content">

          <span class="dashboard-date">
            ${getTodayLabel()}
          </span>


          <h1 class="dashboard-title">

            <span id="dashboardGreeting">
              ${getGreeting()}
            </span>,

            <span id="dashboardUserFirstName">
              Parent
            </span>

          </h1>


          <p class="dashboard-subtitle">
            A clear view of what needs your attention today, what's coming next, and how to get ready for tomorrow.
          </p>

        </div>


        <div class="dashboard-hero-action">

          <button
            type="button"
            class="quick-add-button"
            id="quickAddButton"
          >

            ${icons.plus}

            <span>
              Add something
            </span>

          </button>

        </div>

      </section>


      <!-- =====================================
           FAMILY PULSE
      ====================================== -->

      <section class="dashboard-pulse-section">

        <div class="dashboard-pulse-header">

          <div>

            <span class="dashboard-section-eyebrow">
              Family pulse
            </span>

            <h2>
              Everything at a glance
            </h2>

          </div>


          <p>
            Your family's current activity, updated automatically.
          </p>

        </div>


        <div class="dashboard-summary-grid">


          <!-- TODAY -->

          <article
            class="
              summary-card
              dashboard-stat-card
              dashboard-stat-today
            "
          >

            <div class="summary-card-icon summary-icon-today">
              ${icons.today}
            </div>


            <div class="summary-card-content">

              <span class="summary-card-label">
                Today's tasks
              </span>


              <strong
                class="summary-card-value"
                id="todayTaskCount"
              >
                0
              </strong>


              <span
                class="summary-card-detail"
                id="todayTaskSummaryDetail"
              >
                No tasks due today
              </span>

            </div>


            <span class="dashboard-stat-arrow">
              ${icons.chevron}
            </span>

          </article>


          <!-- UPCOMING -->

          <article
            class="
              summary-card
              dashboard-stat-card
              dashboard-stat-upcoming
            "
          >

            <div class="summary-card-icon summary-icon-upcoming">

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
                  cy="12"
                  r="9"
                ></circle>

                <path d="M12 7v5l3 2"></path>
              </svg>

            </div>


            <div class="summary-card-content">

              <span class="summary-card-label">
                Coming up
              </span>


              <strong
                class="summary-card-value"
                id="upcomingCount"
              >
                0
              </strong>


              <span
                class="summary-card-detail"
                id="upcomingSummaryDetail"
              >
                No upcoming tasks yet
              </span>

            </div>


            <span class="dashboard-stat-arrow">
              ${icons.chevron}
            </span>

          </article>


          <!-- CHILDREN -->

          <article
            class="
              summary-card
              dashboard-stat-card
              dashboard-stat-children
            "
          >

            <div class="summary-card-icon summary-icon-children">
              ${icons.children}
            </div>


            <div class="summary-card-content">

              <span class="summary-card-label">
                Your children
              </span>


              <strong
                class="summary-card-value"
                id="childrenCount"
              >
                0
              </strong>


              <span
                class="summary-card-detail"
                id="childrenSummaryDetail"
              >
                Add your first child
              </span>

            </div>


            <span class="dashboard-stat-arrow">
              ${icons.chevron}
            </span>

          </article>


          <!-- TOMORROW -->

          <article
            class="
              summary-card
              dashboard-stat-card
              dashboard-stat-tomorrow
            "
          >

            <div class="summary-card-icon summary-icon-tomorrow">
              ${icons.tomorrow}
            </div>


            <div class="summary-card-content">

              <span class="summary-card-label">
                Tomorrow prep
              </span>


              <strong
                class="summary-card-value"
                id="tomorrowPrepCount"
              >
                0
              </strong>


              <span
                class="summary-card-detail"
                id="tomorrowPrepSummaryDetail"
              >
                Nothing to prepare yet
              </span>

            </div>


            <span class="dashboard-stat-arrow">
              ${icons.chevron}
            </span>

          </article>

        </div>

      </section>


      <!-- =====================================
           PRIMARY WORKSPACE
      ====================================== -->

      <div class="dashboard-workspace-grid">


        <!-- =================================
             TODAY — PRIMARY FOCUS
        ================================== -->

        <section
          class="
            dashboard-panel
            today-panel
            dashboard-focus-panel
          "
        >

          <div class="dashboard-focus-header">

            <div class="dashboard-focus-heading">

              <span class="dashboard-focus-icon">
                ${icons.today}
              </span>


              <div>

                <span class="panel-eyebrow">
                  Today's focus
                </span>


                <h2>
                  What needs your attention
                </h2>


                <p>
                  Stay on top of the things that matter today.
                </p>

              </div>

            </div>


            <button
              type="button"
              class="panel-link-button"
              data-view-target="today"
            >

              <span>
                See full day
              </span>

              ${icons.arrow}

            </button>

          </div>


          <div
            class="today-list dashboard-focus-list"
            id="dashboardTodayList"
          >

            ${createDashboardTodayEmptyState()}

          </div>

        </section>


        <!-- =================================
             RIGHT COLUMN
        ================================== -->

        <aside class="dashboard-side-stack">


          <!-- TOMORROW -->

          <section
            class="
              dashboard-panel
              tomorrow-panel
              dashboard-tomorrow-feature
            "
          >

            <div class="tomorrow-panel-decoration"></div>


            <div class="dashboard-tomorrow-top">

              <span class="dashboard-tomorrow-icon">
                ${icons.tomorrow}
              </span>


              <div>

                <span class="panel-eyebrow">
                  Prepare for tomorrow
                </span>


                <h2>
                  End today feeling ready
                </h2>

              </div>

            </div>


            <p
              class="tomorrow-panel-description"
              id="dashboardTomorrowDescription"
            >
              Review school bags, activities, homework and anything else your family needs for the next day.
            </p>


            <div
              class="dashboard-tomorrow-preview"
              id="dashboardTomorrowPreview"
            ></div>


            <button
              type="button"
              class="tomorrow-panel-button"
              data-view-target="tomorrow"
            >

              <span>
                Open tomorrow checklist
              </span>

              ${icons.arrow}

            </button>

          </section>


          <!-- FAMILY -->

          <section
            class="
              dashboard-panel
              family-panel
              dashboard-family-panel
            "
          >

            <div class="dashboard-panel-header">

              <div>

                <span class="panel-eyebrow">
                  Your family
                </span>


                <h2>
                  Children overview
                </h2>

              </div>


              <button
                type="button"
                class="panel-link-button"
                data-view-target="children"
              >

                <span>
                  Manage
                </span>

                ${icons.arrow}

              </button>

            </div>


            <div
              class="children-preview-list"
              id="dashboardChildrenList"
            >

              ${createDashboardChildrenEmptyState()}

            </div>

          </section>

        </aside>

      </div>


      <!-- =====================================
           UPCOMING — FULL WIDTH
      ====================================== -->

      <section
        class="
          dashboard-panel
          upcoming-panel
          dashboard-upcoming-feature
        "
      >

        <div class="dashboard-upcoming-header">

          <div class="dashboard-upcoming-heading">

            <span class="dashboard-upcoming-date">

              <strong>
                ${dateNumber}
              </strong>

              <span>
                ${monthLabel}
              </span>

            </span>


            <div>

              <span class="panel-eyebrow">
                Coming up
              </span>


              <h2>
                Next on your family calendar
              </h2>


              <p>
                See what's ahead and stay one step ahead of the week.
              </p>

            </div>

          </div>


          <button
            type="button"
            class="panel-link-button dashboard-planner-button"
            data-view-target="planner"
          >

            <span>
              Open planner
            </span>

            ${icons.arrow}

          </button>

        </div>


        <div
          class="dashboard-upcoming-content"
          id="dashboardUpcomingList"
        >

          ${createDashboardUpcomingEmptyState(
            dateNumber,
            monthLabel
          )}

        </div>

      </section>


    </section>
  `;

}


/* =========================================
   DASHBOARD EMPTY STATES
========================================= */

function createDashboardTodayEmptyState() {

  return `
    <div class="dashboard-empty-state">

      <div class="empty-state-icon">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
        >
          <rect
            x="4"
            y="5"
            width="16"
            height="15"
            rx="3"
          ></rect>

          <path d="M8 3v4"></path>
          <path d="M16 3v4"></path>
          <path d="M4 10h16"></path>
        </svg>

      </div>


      <div>

        <strong>
          Your day is clear
        </strong>

        <p>
          Add a task and it will appear here automatically.
        </p>

      </div>


      <button
        type="button"
        class="empty-state-action"
        id="dashboardAddFirstTaskButton"
      >
        Add first task
      </button>

    </div>
  `;

}


function createDashboardChildrenEmptyState() {

  return `
    <div class="dashboard-empty-state compact">

      <div class="empty-state-icon">

        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.7"
        >
          <circle cx="9" cy="8" r="3"></circle>

          <path d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"></path>

          <path d="M17 8v6"></path>

          <path d="M14 11h6"></path>
        </svg>

      </div>


      <div>

        <strong>
          Add your first child
        </strong>

        <p>
          Each child gets their own tasks, planner and daily view.
        </p>

      </div>


      <button
        type="button"
        class="empty-state-action"
        id="dashboardAddFirstChildButton"
      >
        Add child
      </button>

    </div>
  `;

}


function createDashboardUpcomingEmptyState(
  dateNumber = new Date().getDate(),
  monthLabel = new Intl.DateTimeFormat(
    'en-GB',
    {
      month: 'short'
    }
  ).format(new Date())
) {

  return `
    <div class="upcoming-empty-state">

      <span class="upcoming-date-box">

        <strong>
          ${dateNumber}
        </strong>

        <span>
          ${monthLabel}
        </span>

      </span>


      <div>

        <strong>
          No upcoming plans yet
        </strong>

        <p>
          Future tasks, activities and appointments will appear here.
        </p>

      </div>

    </div>
  `;

}


/* =========================================
   PLACEHOLDER VIEWS
========================================= */

function createPlaceholderView({
  id,
  eyebrow,
  title,
  description
}) {

  return `
    <section
      class="app-view placeholder-view"
      data-app-view="${id}"
      hidden
    >

      <div class="placeholder-view-content">

        <span class="panel-eyebrow">
          ${eyebrow}
        </span>

        <h1>
          ${title}
        </h1>

        <p>
          ${description}
        </p>

      </div>

    </section>
  `;

}


/* =========================================
   GLOBAL TASK MODAL
========================================= */

function createGlobalTaskModal() {

  return `
    <div
      class="child-modal-backdrop"
      id="globalTaskModalBackdrop"
      hidden
    >

      <section
        class="child-modal child-task-modal global-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="globalTaskModalTitle"
      >

        <div class="child-modal-header">

          <div>

            <span class="child-modal-eyebrow">
              New task
            </span>

            <h2 id="globalTaskModalTitle">
              Add a task
            </h2>

            <p>
              Create a task and choose which child it belongs to.
            </p>

          </div>


          <button
            type="button"
            class="child-modal-close"
            id="globalTaskModalCloseButton"
            aria-label="Close task form"
          >
            ${icons.close}
          </button>

        </div>


        <form
          class="child-form"
          id="globalTaskForm"
        >

          <!-- TASK TITLE -->

          <div class="child-form-group">

            <label for="globalTaskTitle">
              Task title
            </label>


            <div class="child-input-wrapper">

              <span class="child-input-icon">
                ${icons.task}
              </span>


              <input
                type="text"
                id="globalTaskTitle"
                placeholder="For example, Finish maths homework"
                maxlength="120"
                autocomplete="off"
                required
              >

            </div>

          </div>


          <!-- ASSIGN TO CHILD -->

          <div class="child-form-group">

            <label for="globalTaskChildId">
              Assign to child
            </label>


            <select
              id="globalTaskChildId"
              class="child-task-select"
              required
            >

              <option value="">
                Select a child
              </option>

            </select>

          </div>


          <!-- CATEGORY -->

          <div class="child-form-group">

            <label for="globalTaskCategory">
              Category
            </label>


            <select
              id="globalTaskCategory"
              class="child-task-select"
            >

              <option value="general">
                General
              </option>

              <option value="homework">
                Homework
              </option>

              <option value="school">
                School
              </option>

              <option value="chore">
                Chore
              </option>

              <option value="appointment">
                Appointment
              </option>

              <option value="reminder">
                Reminder
              </option>

            </select>

          </div>


          <!-- DATE + TIME -->

          <div class="child-task-form-row">

            <div class="child-form-group">

              <label for="globalTaskDueDate">

                Due date

                <span>
                  Optional
                </span>

              </label>


              <input
                type="date"
                id="globalTaskDueDate"
                class="child-task-plain-input"
              >

            </div>


            <div class="child-form-group">

              <label for="globalTaskDueTime">

                Due time

                <span>
                  Optional
                </span>

              </label>


              <input
                type="time"
                id="globalTaskDueTime"
                class="child-task-plain-input"
              >

            </div>

          </div>


          <!-- NOTES -->

          <div class="child-form-group">

            <label for="globalTaskNotes">

              Task notes

              <span>
                Optional
              </span>

            </label>


            <textarea
              id="globalTaskNotes"
              placeholder="Add any useful details..."
              maxlength="500"
              rows="4"
            ></textarea>


            <div class="child-textarea-footer">

              <span>
                Keep it clear and useful.
              </span>

              <span id="globalTaskNotesCounter">
                0 / 500
              </span>

            </div>

          </div>


          <!-- STATUS -->

          <div
            id="globalTaskFormStatus"
            hidden
          ></div>


          <!-- ACTIONS -->

          <div class="child-form-actions">

            <button
              type="button"
              class="child-secondary-button"
              id="globalTaskCancelButton"
            >
              Cancel
            </button>


            <button
              type="submit"
              class="children-primary-button"
              id="globalTaskSaveButton"
            >

              ${icons.plus}

              <span id="globalTaskSaveButtonText">
                Add task
              </span>

            </button>

          </div>

        </form>

      </section>

    </div>
  `;

}


/* =========================================
   COMPLETE APP TEMPLATE
========================================= */

function createAppTemplate() {

  return `
    <div class="familyflow-app">


      <!-- =====================================
           DESKTOP SIDEBAR
      ====================================== -->

      <aside class="app-sidebar">

        <div class="sidebar-top">

          <a
            href="#"
            class="app-brand"
            aria-label="FamilyFlow Dashboard"
          >

            <div class="sidebar-brand-logo">
  <img
    src="${familyFlowLogo}"
    alt="FamilyFlow"
  >
</div>
          </a>


          <nav
            class="app-sidebar-nav"
            aria-label="Main navigation"
          >
            ${createDesktopNavigation()}
          </nav>

        </div>


        <div class="sidebar-bottom">

          <div class="sidebar-family-note">

            <span class="sidebar-family-note-icon">
              ${icons.shield}
            </span>


            <div>

              <strong>
                Your family space
              </strong>

              <span>
                Private and secure
              </span>

            </div>

          </div>


          <button
            type="button"
            class="sidebar-profile"
            id="sidebarProfileButton"
          >

            <span
              class="sidebar-profile-avatar"
              id="sidebarUserInitials"
            >
              P
            </span>


            <span class="sidebar-profile-details">

              <strong id="sidebarUserName">
                Parent
              </strong>

              <small id="sidebarUserEmail">
                parent@example.com
              </small>

            </span>


            <span class="sidebar-profile-chevron">
              ${icons.chevron}
            </span>

          </button>

        </div>

      </aside>


      <!-- =====================================
           MAIN APP AREA
      ====================================== -->

      <div class="app-main-shell">


        <!-- HEADER -->

        <header class="app-header">

          <div class="app-header-left">

            <button
              type="button"
              class="mobile-profile-button"
              id="mobileProfileButton"
              aria-label="Open profile"
            >
              <span id="mobileUserInitials">
                P
              </span>
            </button>


            <div class="app-header-heading">

              <span id="currentViewEyebrow">
                Family overview
              </span>

              <h2 id="currentViewTitle">
                Dashboard
              </h2>

            </div>

          </div>


          <div class="app-header-actions">

            <button
              type="button"
              class="app-icon-button"
              id="notificationButton"
              aria-label="Notifications"
            >
              ${icons.bell}
            </button>


            <button
              type="button"
              class="header-add-button"
              id="headerAddButton"
            >

              ${icons.plus}

              <span>
                Add
              </span>

            </button>

          </div>

        </header>


        <!-- CONTENT -->

        <main
          class="app-content"
          id="appContent"
        >

          ${createDashboardView()}


          ${createTodayView()}


          ${createChildrenView()}


         ${createPlannerView()}


${createTomorrowView()}

        </main>

      </div>


      <!-- MOBILE NAV -->

      <nav
        class="mobile-bottom-nav"
        aria-label="Mobile navigation"
      >
        ${createMobileNavigation()}
      </nav>


<!-- GLOBAL TASK MODAL -->

${createGlobalTaskModal()}


<!-- PARENT PROFILE PANEL -->

${createProfilePanel()}

</div>
  `;

}


/* =========================================
   VIEW METADATA
========================================= */

const viewMetadata = {

  dashboard: {
    eyebrow: 'Family overview',
    title: 'Dashboard'
  },

  today: {
    eyebrow: 'Your family today',
    title: 'Today'
  },

  children: {
    eyebrow: 'Your family',
    title: 'Children'
  },

  planner: {
    eyebrow: 'Family calendar',
    title: 'Planner'
  },

  tomorrow: {
    eyebrow: 'Prepare ahead',
    title: 'Tomorrow'
  }

};


/* =========================================
   CHANGE ACTIVE VIEW
========================================= */

function changeAppView(
  viewId
) {

  const validView =
    navigationItems.some(
      (item) =>
        item.id === viewId
    );


  if (!validView) {
    return;
  }


  currentView =
    viewId;


  document
    .querySelectorAll(
      '[data-app-view]'
    )
    .forEach((view) => {

      view.hidden =
        view.dataset.appView
        !== viewId;

    });


  document
    .querySelectorAll(
      '[data-view]'
    )
    .forEach((button) => {

      button.classList.toggle(
        'is-active',
        button.dataset.view === viewId
      );

    });


  const metadata =
    viewMetadata[viewId];


  const eyebrowElement =
    document.querySelector(
      '#currentViewEyebrow'
    );


  const titleElement =
    document.querySelector(
      '#currentViewTitle'
    );


  if (eyebrowElement) {

    eyebrowElement.textContent =
      metadata.eyebrow;

  }


  if (titleElement) {

    titleElement.textContent =
      metadata.title;

  }


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


/* =========================================
   GLOBAL TASK MODAL HELPERS
========================================= */

function populateGlobalTaskChildOptions(
  selectedChildId = ''
) {

  const select =
    document.querySelector(
      '#globalTaskChildId'
    );


  if (!select) {
    return;
  }


  select.innerHTML = `
    <option value="">
      Select a child
    </option>

    ${dashboardChildren
      .map((child) => {

        const childId =
          escapeAppHtml(
            child?.id || ''
          );


        const childName =
          escapeAppHtml(
            child?.name || 'Child'
          );


        const selected =
          child?.id === selectedChildId
            ? 'selected'
            : '';


        return `
          <option
            value="${childId}"
            ${selected}
          >
            ${childName}
          </option>
        `;

      })
      .join('')}
  `;

}


/* =========================================
   GLOBAL TASK FORM STATUS
========================================= */

function showGlobalTaskFormStatus(
  message,
  type = 'info'
) {

  const status =
    document.querySelector(
      '#globalTaskFormStatus'
    );


  if (!status) {
    return;
  }


  status.hidden =
    false;


  status.textContent =
    message;


  status.style.padding =
    '11px 13px';


  status.style.marginBottom =
    '12px';


  status.style.borderRadius =
    '11px';


  status.style.fontSize =
    '11px';


  status.style.fontWeight =
    '600';


  status.style.lineHeight =
    '1.5';


  status.style.background =
    type === 'success'
      ? '#edf7f3'
      : type === 'error'
        ? '#fdf0f0'
        : '#f2f6f8';


  status.style.color =
    type === 'success'
      ? '#39705c'
      : type === 'error'
        ? '#a94f4f'
        : '#16324f';

}


function clearGlobalTaskFormStatus() {

  const status =
    document.querySelector(
      '#globalTaskFormStatus'
    );


  if (!status) {
    return;
  }


  status.hidden =
    true;


  status.textContent =
    '';

}


/* =========================================
   GLOBAL TASK NOTES COUNTER
========================================= */

function updateGlobalTaskNotesCounter() {

  const notesInput =
    document.querySelector(
      '#globalTaskNotes'
    );


  const counter =
    document.querySelector(
      '#globalTaskNotesCounter'
    );


  if (
    !notesInput
    || !counter
  ) {
    return;
  }


  counter.textContent =
    `${notesInput.value.length} / 500`;

}


/* =========================================
   OPEN GLOBAL TASK MODAL
========================================= */

function openGlobalTaskModal({
  defaultChildId = '',
  defaultDueDate = ''
} = {}) {

  /*
    A task cannot be assigned if no child
    exists yet. In that case, guide the
    parent directly to Add Child.
  */

  if (!dashboardChildren.length) {

    changeAppView(
      'children'
    );


    setTimeout(() => {

      document
        .querySelector(
          '#addChildButton'
        )
        ?.click();

    }, 60);


    return;

  }


  const backdrop =
    document.querySelector(
      '#globalTaskModalBackdrop'
    );


  const form =
    document.querySelector(
      '#globalTaskForm'
    );


  const dueDateInput =
    document.querySelector(
      '#globalTaskDueDate'
    );


  if (
    !backdrop
    || !form
  ) {
    return;
  }


  form.reset();


  clearGlobalTaskFormStatus();


  populateGlobalTaskChildOptions(
    defaultChildId
  );


  if (
    dueDateInput
    && defaultDueDate
  ) {

    dueDateInput.value =
      defaultDueDate;

  }


  updateGlobalTaskNotesCounter();


  backdrop.hidden =
    false;


  document.body.classList.add(
    'child-modal-open'
  );


  requestAnimationFrame(() => {

    backdrop.classList.add(
      'is-visible'
    );

  });


  setTimeout(() => {

    document
      .querySelector(
        '#globalTaskTitle'
      )
      ?.focus();

  }, 180);

}


/* =========================================
   CLOSE GLOBAL TASK MODAL
========================================= */

function closeGlobalTaskModal() {

  const backdrop =
    document.querySelector(
      '#globalTaskModalBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'child-modal-open'
  );


  setTimeout(() => {

    backdrop.hidden =
      true;


    clearGlobalTaskFormStatus();


    document
      .querySelector(
        '#globalTaskForm'
      )
      ?.reset();


    updateGlobalTaskNotesCounter();

  }, 220);

}


/* =========================================
   SUBMIT GLOBAL TASK
========================================= */

async function handleGlobalTaskFormSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  if (
    globalTaskModalActionInProgress
  ) {
    return;
  }


  const childId =
    document
      .querySelector(
        '#globalTaskChildId'
      )
      ?.value.trim()
    || '';


  const title =
    document
      .querySelector(
        '#globalTaskTitle'
      )
      ?.value.trim()
    || '';


  const category =
    document
      .querySelector(
        '#globalTaskCategory'
      )
      ?.value
    || 'general';


  const dueDate =
    document
      .querySelector(
        '#globalTaskDueDate'
      )
      ?.value
    || '';


  const dueTime =
    document
      .querySelector(
        '#globalTaskDueTime'
      )
      ?.value
    || '';


  const notes =
    document
      .querySelector(
        '#globalTaskNotes'
      )
      ?.value.trim()
    || '';


  const saveButton =
    document.querySelector(
      '#globalTaskSaveButton'
    );


  const originalButtonHtml =
    saveButton?.innerHTML || '';


  /* -----------------------------------------
     CHILD VALIDATION
  ----------------------------------------- */

  if (!childId) {

    showGlobalTaskFormStatus(
      'Please select which child this task belongs to.',
      'error'
    );


    document
      .querySelector(
        '#globalTaskChildId'
      )
      ?.focus();


    return;

  }


  /* -----------------------------------------
     TITLE VALIDATION
  ----------------------------------------- */

  if (title.length < 2) {

    showGlobalTaskFormStatus(
      'Please enter a task title.',
      'error'
    );


    document
      .querySelector(
        '#globalTaskTitle'
      )
      ?.focus();


    return;

  }


  try {

    globalTaskModalActionInProgress =
      true;


    if (saveButton) {

      saveButton.disabled =
        true;


      saveButton.innerHTML = `
        <span>
          Adding task...
        </span>
      `;

    }


    showGlobalTaskFormStatus(
      'Saving task...',
      'info'
    );


    await createTask({

      childId,

      title,

      notes,

      category,

      dueDate,

      dueTime

    });


    showGlobalTaskFormStatus(
      'Task added successfully.',
      'success'
    );


    setTimeout(() => {

      closeGlobalTaskModal();


      /*
        Keep the form clean after successful
        submission without relying on
        event.currentTarget after an await.
      */

      form.reset();

    }, 450);

  } catch (error) {

    console.error(
      'Global task creation failed:',
      error
    );


    showGlobalTaskFormStatus(
      error?.message
      || 'We could not save this task. Please try again.',
      'error'
    );

  } finally {

    globalTaskModalActionInProgress =
      false;


    if (saveButton) {

      saveButton.disabled =
        false;


      saveButton.innerHTML =
        originalButtonHtml;

    }

  }

}


/* =========================================
   GLOBAL TASK MODAL ESCAPE KEY
========================================= */

function handleGlobalTaskModalEscapeKey(
  event
) {

  if (
    event.key !== 'Escape'
  ) {
    return;
  }


  const backdrop =
    document.querySelector(
      '#globalTaskModalBackdrop'
    );


  if (
    backdrop
    && !backdrop.hidden
  ) {

    closeGlobalTaskModal();

  }

}


/* =========================================
   DASHBOARD TASK HELPERS
========================================= */

function getDashboardTomorrowDateString() {

  const date =
    new Date();


  date.setDate(
    date.getDate() + 1
  );


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


function getDashboardTaskCategoryLabel(
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


function getSafeDashboardTaskCategory(
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


function formatDashboardTaskDate(
  dateValue = ''
) {

  if (!dateValue) {
    return '';
  }


  if (
    dateValue === getTodayDateString()
  ) {
    return 'Today';
  }


  if (
    dateValue
    === getDashboardTomorrowDateString()
  ) {
    return 'Tomorrow';
  }


  const parts =
    String(dateValue)
      .split('-')
      .map(Number);


  if (
    parts.length !== 3
    || parts.some(Number.isNaN)
  ) {
    return dateValue;
  }


  const [
    year,
    month,
    day
  ] = parts;


  return new Intl.DateTimeFormat(
    'en-GB',
    {
      weekday: 'short',
      day: 'numeric',
      month: 'short'
    }
  ).format(
    new Date(
      year,
      month - 1,
      day
    )
  );

}


function formatDashboardTaskTime(
  timeValue = ''
) {

  if (!timeValue) {
    return '';
  }


  const [
    hours,
    minutes
  ] = String(timeValue)
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
      hour: 'numeric',
      minute: '2-digit'
    }
  ).format(date);

}


function getDashboardChildById(
  childId = ''
) {

  return dashboardChildren.find(
    (child) =>
      child.id === childId
  ) || null;

}


function sortDashboardTasks(
  tasks = []
) {

  return [...tasks].sort(
    (
      taskA,
      taskB
    ) => {

      const dateA =
        taskA.dueDate
        || '9999-12-31';


      const dateB =
        taskB.dueDate
        || '9999-12-31';


      if (dateA !== dateB) {

        return dateA.localeCompare(
          dateB
        );

      }


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
   CREATE DASHBOARD TASK CARD
========================================= */

function createDashboardTaskCard(
  task,
  {
    showDate = false,
    targetView = ''
  } = {}
) {
  const id =
    escapeAppHtml(
      task?.id || ''
    );


  const title =
    escapeAppHtml(
      task?.title
      || 'Untitled task'
    );


  const category =
    getSafeDashboardTaskCategory(
      task?.category
    );


  const categoryLabel =
    escapeAppHtml(
      getDashboardTaskCategoryLabel(
        category
      )
    );


  const child =
    getDashboardChildById(
      task?.childId || ''
    );


  const childName =
    escapeAppHtml(
      child?.name || 'Child'
    );


  const dueDate =
    formatDashboardTaskDate(
      task?.dueDate || ''
    );


  const dueTime =
    formatDashboardTaskTime(
      task?.dueTime || ''
    );


  const completed =
    Boolean(
      task?.completed
    );


  return `
<article
  class="
    child-task-card
    dashboard-task-card
    ${targetView ? 'is-clickable' : ''}
    ${completed ? 'is-completed' : ''}
  "
  data-dashboard-task-id="${id}"
  ${
    targetView
      ? `data-dashboard-task-target="${escapeAppHtml(targetView)}"`
      : ''
  }
>

      <button
        type="button"
        class="
          child-task-complete-button
          ${completed ? 'is-completed' : ''}
        "
        data-dashboard-toggle-task="${id}"
        aria-label="${
          completed
            ? `Mark ${title} as incomplete`
            : `Mark ${title} as complete`
        }"
      >

        ${
          completed
            ? `
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
            `
            : ''
        }

      </button>


      <div class="child-task-main">

        <div class="child-task-title-row">

          <h3>
            ${title}
          </h3>


          <span
            class="
              child-task-category
              child-task-category-${category}
            "
          >
            ${categoryLabel}
          </span>

        </div>


        <div class="child-task-meta">

          <span>
            ${childName}
          </span>


          ${
            showDate && dueDate
              ? `
                <span>
                  ${escapeAppHtml(
                    dueDate
                  )}
                </span>
              `
              : ''
          }


          ${
            dueTime
              ? `
                <span>
                  ${escapeAppHtml(
                    dueTime
                  )}
                </span>
              `
              : ''
          }

        </div>

      </div>

    </article>
  `;

}


/* =========================================
   UPDATE DASHBOARD TASK DATA
========================================= */

function updateDashboardTasks(
  tasks = []
) {

  dashboardTasks =
    Array.isArray(tasks)
      ? tasks.map(
          (task) => ({
            ...task
          })
        )
      : [];


  const today =
    getTodayDateString();


  const allTodayTasks =
    sortDashboardTasks(
      dashboardTasks.filter(
        (task) =>
          task.dueDate === today
      )
    );


  const openTodayTasks =
    allTodayTasks.filter(
      (task) =>
        !task.completed
    );


  const upcomingTasks =
    sortDashboardTasks(
      dashboardTasks.filter(
        (task) =>
          !task.completed
          && task.dueDate
          && task.dueDate > today
      )
    );

    const tomorrowDate =
  getDashboardTomorrowDateString();


const allTomorrowTasks =
  sortDashboardTasks(
    dashboardTasks.filter(
      (task) =>
        task.dueDate === tomorrowDate
    )
  );


const openTomorrowTasks =
  allTomorrowTasks.filter(
    (task) =>
      !task.completed
  );


  const todayTaskCount =
    document.querySelector(
      '#todayTaskCount'
    );


  const todayTaskSummaryDetail =
    document.querySelector(
      '#todayTaskSummaryDetail'
    );


  const upcomingCount =
    document.querySelector(
      '#upcomingCount'
    );


  const upcomingSummaryDetail =
    document.querySelector(
      '#upcomingSummaryDetail'
    );

    const tomorrowPrepCount =
  document.querySelector(
    '#tomorrowPrepCount'
  );


const tomorrowPrepSummaryDetail =
  document.querySelector(
    '#tomorrowPrepSummaryDetail'
  );


const dashboardTomorrowDescription =
  document.querySelector(
    '#dashboardTomorrowDescription'
  );


const dashboardTomorrowPreview =
  document.querySelector(
    '#dashboardTomorrowPreview'
  );


  const dashboardTodayList =
    document.querySelector(
      '#dashboardTodayList'
    );


  const dashboardUpcomingList =
    document.querySelector(
      '#dashboardUpcomingList'
    );


  if (todayTaskCount) {

    todayTaskCount.textContent =
      String(
        openTodayTasks.length
      );

  }


  if (todayTaskSummaryDetail) {

    if (!openTodayTasks.length) {

      todayTaskSummaryDetail.textContent =
        allTodayTasks.length
          ? 'Everything due today is done'
          : 'No tasks due today';

    } else if (
      openTodayTasks.length === 1
    ) {

      todayTaskSummaryDetail.textContent =
        '1 open task today';

    } else {

      todayTaskSummaryDetail.textContent =
        `${openTodayTasks.length} open tasks today`;

    }

  }


  if (upcomingCount) {

    upcomingCount.textContent =
      String(
        upcomingTasks.length
      );

  }


  if (upcomingSummaryDetail) {

  if (!upcomingTasks.length) {

    upcomingSummaryDetail.textContent =
      'No upcoming tasks yet';

  } else if (
    upcomingTasks.length === 1
  ) {

    upcomingSummaryDetail.textContent =
      '1 future task';

  } else {

    upcomingSummaryDetail.textContent =
      `${upcomingTasks.length} future tasks`;

  }

}


/* -----------------------------------------
   TOMORROW SUMMARY
----------------------------------------- */

if (tomorrowPrepCount) {

  tomorrowPrepCount.textContent =
    String(
      openTomorrowTasks.length
    );

}


if (tomorrowPrepSummaryDetail) {

  if (openTomorrowTasks.length === 0) {

    tomorrowPrepSummaryDetail.textContent =
      allTomorrowTasks.length
        ? 'Everything is ready'
        : 'Nothing to prepare yet';

  } else if (
    openTomorrowTasks.length === 1
  ) {

    tomorrowPrepSummaryDetail.textContent =
      '1 item still needs attention';

  } else {

    tomorrowPrepSummaryDetail.textContent =
      `${openTomorrowTasks.length} items still need attention`;

  }

}


if (dashboardTomorrowDescription) {

  if (openTomorrowTasks.length === 0) {

    dashboardTomorrowDescription.textContent =
      allTomorrowTasks.length
        ? 'Everything planned for tomorrow is ready. You are all set for the next day.'
        : 'Review school bags, activities, homework and anything else your family needs for the next day.';

  } else if (
    openTomorrowTasks.length === 1
  ) {

    dashboardTomorrowDescription.textContent =
      '1 item still needs attention before tomorrow.';

  } else {

    dashboardTomorrowDescription.textContent =
      `${openTomorrowTasks.length} items still need attention before tomorrow.`;

  }

}


if (dashboardTomorrowPreview) {

  if (openTomorrowTasks.length) {

    const visibleTomorrowTasks =
      openTomorrowTasks.slice(
        0,
        3
      );


    dashboardTomorrowPreview.innerHTML = `
      <div class="child-task-list dashboard-task-list">

        ${visibleTomorrowTasks
          .map(
            (task) =>
              createDashboardTaskCard(
                task,
                {
                  targetView: 'tomorrow'
                }
              )
          )
          .join('')}

      </div>


      ${
        openTomorrowTasks.length > 3
          ? `
            <button
              type="button"
              class="dashboard-more-children-button"
              id="dashboardViewAllTomorrowButton"
            >
              View all ${openTomorrowTasks.length} tomorrow items
            </button>
          `
          : ''
      }
    `;

  } else {

    dashboardTomorrowPreview.innerHTML =
      '';

  }

}


  /* -----------------------------------------
     TODAY PANEL
  ----------------------------------------- */

  if (dashboardTodayList) {

    if (openTodayTasks.length) {

      const visibleTodayTasks =
        openTodayTasks.slice(
          0,
          5
        );


      dashboardTodayList.innerHTML = `
        <div class="child-task-list dashboard-task-list">

          ${visibleTodayTasks
            .map(
              (task) =>
                createDashboardTaskCard(
                  task
                )
            )
            .join('')}

        </div>


        ${
          openTodayTasks.length > 5
            ? `
              <button
                type="button"
                class="dashboard-more-children-button"
                id="dashboardViewAllTodayButton"
              >
                View all ${openTodayTasks.length} tasks due today
              </button>
            `
            : ''
        }
      `;

    } else if (
      allTodayTasks.length
    ) {

      dashboardTodayList.innerHTML = `
        <div class="dashboard-empty-state">

          <div class="empty-state-icon">

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
                cy="12"
                r="9"
              ></circle>

              <path d="m8 12 2.5 2.5L16 9"></path>
            </svg>

          </div>


          <div>

            <strong>
              Everything is done for today
            </strong>

            <p>
              All ${allTodayTasks.length} task${
                allTodayTasks.length === 1
                  ? ''
                  : 's'
              } due today ${
                allTodayTasks.length === 1
                  ? 'is'
                  : 'are'
              } complete.
            </p>

          </div>


          <button
            type="button"
            class="empty-state-action"
            id="dashboardAddAnotherTaskButton"
          >
            Add another task
          </button>

        </div>
      `;

    } else {

      dashboardTodayList.innerHTML =
        createDashboardTodayEmptyState();

    }

  }


  /* -----------------------------------------
     UPCOMING PANEL
  ----------------------------------------- */

  if (dashboardUpcomingList) {

    if (upcomingTasks.length) {

      const visibleUpcomingTasks =
        upcomingTasks.slice(
          0,
          3
        );


      dashboardUpcomingList.innerHTML = `
        <div class="child-task-list dashboard-task-list">

          ${visibleUpcomingTasks
            .map(
              (task) =>
                createDashboardTaskCard(
                  task,
                  {
                    showDate: true
                  }
                )
            )
            .join('')}

        </div>


        ${
          upcomingTasks.length > 3
            ? `
              <button
                type="button"
                class="dashboard-more-children-button"
                id="dashboardViewAllUpcomingButton"
              >
                View all ${upcomingTasks.length} upcoming tasks
              </button>
            `
            : ''
        }
      `;

    } else {

      dashboardUpcomingList.innerHTML =
        createDashboardUpcomingEmptyState();

    }

  }


  attachDashboardTaskActions();

}


/* =========================================
   DASHBOARD TASK ACTIONS
========================================= */

function attachDashboardTaskActions() {

    document
  .querySelectorAll(
    '[data-dashboard-task-target]'
  )
  .forEach((card) => {

    card.addEventListener(
      'click',
      (event) => {

        if (
          event.target.closest(
            '[data-dashboard-toggle-task]'
          )
        ) {
          return;
        }


        const targetView =
          card.dataset
            .dashboardTaskTarget;


        if (!targetView) {
          return;
        }


        changeAppView(
          targetView
        );

      }
    );

  });

  document
    .querySelectorAll(
      '[data-dashboard-toggle-task]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        async () => {

          if (
            dashboardTaskActionInProgress
          ) {
            return;
          }


          const taskId =
            button.dataset
              .dashboardToggleTask;


          const task =
            dashboardTasks.find(
              (item) =>
                item.id === taskId
            );


          if (!task) {
            return;
          }


          try {

            dashboardTaskActionInProgress =
              true;


            button.disabled =
              true;


            await toggleTaskCompletion(
              task.id,
              !task.completed
            );

          } catch (error) {

            console.error(
              'Failed to update task from dashboard:',
              error
            );

          } finally {

            dashboardTaskActionInProgress =
              false;


            button.disabled =
              false;

          }

        }
      );

    });


  document
    .querySelector(
      '#dashboardAddFirstTaskButton'
    )
    ?.addEventListener(
      'click',
      () => {

        openDashboardTaskCreationFlow();

      }
    );


  document
    .querySelector(
      '#dashboardAddAnotherTaskButton'
    )
    ?.addEventListener(
      'click',
      () => {

        openDashboardTaskCreationFlow();

      }
    );


  document
    .querySelector(
      '#dashboardViewAllTodayButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changeAppView(
          'today'
        );

      }
    );


  document
    .querySelector(
      '#dashboardViewAllUpcomingButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changeAppView(
          'planner'
        );

      }
    );

    document
  .querySelector(
    '#dashboardViewAllTomorrowButton'
  )
  ?.addEventListener(
    'click',
    () => {

      changeAppView(
        'tomorrow'
      );

    }
  );

}


/* =========================================
   GENERAL TASK CREATION FLOW
========================================= */

function openDashboardTaskCreationFlow(
  options = {}
) {

  openGlobalTaskModal(
    options
  );

}


/* =========================================
   UPDATE DASHBOARD CHILDREN DATA
========================================= */

function updateDashboardChildren(
  children = []
) {

  const safeChildren =
    Array.isArray(children)
      ? children
      : [];


  dashboardChildren =
    safeChildren.map(
      (child) => ({
        ...child
      })
    );


  /*
    Keep the global task selector in sync
    whenever children are added, edited
    or deleted.
  */

  const globalTaskChildSelect =
    document.querySelector(
      '#globalTaskChildId'
    );


  if (globalTaskChildSelect) {

    const currentSelectedChildId =
      globalTaskChildSelect.value;


    populateGlobalTaskChildOptions(
      currentSelectedChildId
    );

  }


  const count =
    safeChildren.length;


  const countElement =
    document.querySelector(
      '#childrenCount'
    );


  const detailElement =
    document.querySelector(
      '#childrenSummaryDetail'
    );


  const listElement =
    document.querySelector(
      '#dashboardChildrenList'
    );


  if (countElement) {

    countElement.textContent =
      String(count);

  }


  if (detailElement) {

    if (!count) {

      detailElement.textContent =
        'Add your first child';

    } else if (count === 1) {

      detailElement.textContent =
        '1 child profile';

    } else {

      detailElement.textContent =
        `${count} child profiles`;

    }

  }


  if (!listElement) {
    return;
  }


  if (!count) {

    listElement.innerHTML =
      createDashboardChildrenEmptyState();


    attachDashboardChildrenActions();


    updateDashboardTasks(
      dashboardTasks
    );


    return;

  }


  const visibleChildren =
    safeChildren.slice(
      0,
      3
    );


  listElement.innerHTML = `
    <div class="dashboard-child-preview-list">

      ${visibleChildren
        .map((child) => {

          const name =
            escapeAppHtml(
              child?.name || 'Child'
            );


          const yearGroup =
            escapeAppHtml(
              child?.yearGroup
              || 'Year group not added'
            );


          const colour =
            getSafeDashboardChildColour(
              child?.colour
            );


          const initial =
            escapeAppHtml(
              getDashboardChildInitial(
                child?.name
              )
            );


          const taskCount =
            Number(
              child?.taskCount || 0
            );


          const childMeta =
            taskCount > 0
              ? `${yearGroup} • ${taskCount} today`
              : yearGroup;


          return `
            <button
              type="button"
              class="dashboard-child-preview"
              data-dashboard-child-id="${escapeAppHtml(
                child?.id || ''
              )}"
            >

              <span
                class="
                  dashboard-child-avatar
                  dashboard-child-avatar-${colour}
                "
              >
                ${initial}
              </span>


              <span class="dashboard-child-details">

                <strong>
                  ${name}
                </strong>

                <small>
                  ${childMeta}
                </small>

              </span>


              <span class="dashboard-child-arrow">
                ${icons.chevron}
              </span>

            </button>
          `;

        })
        .join('')}

    </div>


    ${
      count > 3
        ? `
          <button
            type="button"
            class="dashboard-more-children-button"
            id="dashboardMoreChildrenButton"
          >
            View all ${count} children
          </button>
        `
        : ''
    }
  `;


  attachDashboardChildrenActions();


  updateDashboardTasks(
    dashboardTasks
  );

}


/* =========================================
   DASHBOARD CHILDREN ACTIONS
========================================= */

function attachDashboardChildrenActions() {

  document
    .querySelector(
      '#dashboardAddFirstChildButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changeAppView(
          'children'
        );


        setTimeout(() => {

          document
            .querySelector(
              '#addChildButton'
            )
            ?.click();

        }, 60);

      }
    );


  document
    .querySelector(
      '#dashboardMoreChildrenButton'
    )
    ?.addEventListener(
      'click',
      () => {

        changeAppView(
          'children'
        );

      }
    );


  document
    .querySelectorAll(
      '[data-dashboard-child-id]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const childId =
            button.dataset
              .dashboardChildId;


          changeAppView(
            'children'
          );


          openChildProfileById(
            childId
          );

        }
      );

    });

}


/* =========================================
   SET USER INFORMATION
========================================= */

function populateUserInformation(
  user = {}
) {

  const name =
    String(
      user.displayName || 'Parent'
    ).trim();


  const email =
    String(
      user.email || ''
    ).trim();


  const firstName =
    name
      .split(/\s+/)
      .filter(Boolean)[0]
      || 'Parent';


  const initials =
    getInitials(
      name
    );


  const textUpdates = [
    [
      '#sidebarUserName',
      name
    ],
    [
      '#sidebarUserEmail',
      email
    ],
    [
      '#sidebarUserInitials',
      initials
    ],
    [
      '#mobileUserInitials',
      initials
    ],
    [
      '#dashboardUserFirstName',
      firstName
    ]
  ];


  textUpdates.forEach(
    (
      [
        selector,
        value
      ]
    ) => {

      const element =
        document.querySelector(
          selector
        );


      if (element) {

        element.textContent =
          value;

      }

    }
  );

}


/* =========================================
   ATTACH APP EVENT LISTENERS
========================================= */

function attachAppEventListeners() {

  /* -----------------------------------------
     CHILDREN UPDATES
  ----------------------------------------- */

  window.addEventListener(
    'familyflow:children-updated',
    (event) => {

      updateDashboardChildren(
        event.detail?.children || []
      );

    }
  );


  /* -----------------------------------------
     TASK UPDATES
  ----------------------------------------- */

  window.addEventListener(
    'familyflow:tasks-updated',
    (event) => {

      updateDashboardTasks(
        event.detail?.tasks || []
      );

    }
  );

  /* -----------------------------------------
   PROFILE UPDATES
----------------------------------------- */

window.addEventListener(
  'familyflow:profile-updated',
  (event) => {

    const name =
      String(
        event.detail?.name
        || 'Parent'
      ).trim();


    const email =
      String(
        event.detail?.email
        || ''
      ).trim();


    populateUserInformation({

      displayName:
        name,

      email

    });

  }
);


  /* -----------------------------------------
     MAIN NAVIGATION
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-view]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          changeAppView(
            button.dataset.view
          );

        }
      );

    });


  /* -----------------------------------------
     INTERNAL VIEW LINKS
  ----------------------------------------- */

  document
    .querySelectorAll(
      '[data-view-target]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          changeAppView(
            button.dataset
              .viewTarget
          );

        }
      );

    });

    /* -----------------------------------------
   PARENT PROFILE BUTTONS
----------------------------------------- */

document
  .querySelector(
    '#sidebarProfileButton'
  )
  ?.addEventListener(
    'click',
    () => {

      openProfilePanel();

    }
  );


document
  .querySelector(
    '#mobileProfileButton'
  )
  ?.addEventListener(
    'click',
    () => {

      openProfilePanel();

    }
  );

  /* -----------------------------------------
     GENERAL ADD BUTTONS
  ----------------------------------------- */

  document
    .querySelector(
      '#quickAddButton'
    )
    ?.addEventListener(
      'click',
      () => {

        openDashboardTaskCreationFlow();

      }
    );


  document
    .querySelector(
      '#headerAddButton'
    )
    ?.addEventListener(
      'click',
      () => {

        openDashboardTaskCreationFlow();

      }
    );


  /* -----------------------------------------
     GLOBAL TASK MODAL
  ----------------------------------------- */

  const globalTaskForm =
    document.querySelector(
      '#globalTaskForm'
    );


  const globalTaskBackdrop =
    document.querySelector(
      '#globalTaskModalBackdrop'
    );


  const globalTaskCloseButton =
    document.querySelector(
      '#globalTaskModalCloseButton'
    );


  const globalTaskCancelButton =
    document.querySelector(
      '#globalTaskCancelButton'
    );


  const globalTaskNotesInput =
    document.querySelector(
      '#globalTaskNotes'
    );


  globalTaskForm?.addEventListener(
    'submit',
    handleGlobalTaskFormSubmit
  );


  globalTaskCloseButton?.addEventListener(
    'click',
    closeGlobalTaskModal
  );


  globalTaskCancelButton?.addEventListener(
    'click',
    closeGlobalTaskModal
  );


  globalTaskBackdrop?.addEventListener(
    'click',
    (event) => {

      if (
        event.target
        === globalTaskBackdrop
      ) {

        closeGlobalTaskModal();

      }

    }
  );


  globalTaskNotesInput?.addEventListener(
    'input',
    updateGlobalTaskNotesCounter
  );


  document.addEventListener(
    'keydown',
    handleGlobalTaskModalEscapeKey
  );


  attachDashboardTaskActions();


  attachDashboardChildrenActions();

}


/* =========================================
   RENDER FAMILYFLOW APP
========================================= */

export function renderFamilyFlowApp({
  container,
  user
} = {}) {

  const targetContainer =
    container
    || document.querySelector(
      '#app'
    );


  if (!targetContainer) {

    throw new Error(
      'FamilyFlow could not find the app container.'
    );

  }


  currentView =
    'dashboard';


  dashboardChildren =
    [];


  dashboardTasks =
    [];


  dashboardTaskActionInProgress =
    false;


  globalTaskModalActionInProgress =
    false;


  targetContainer.innerHTML =
    createAppTemplate();


  populateUserInformation(
    user
  );


 attachAppEventListeners();


initialiseProfilePanel({
  user
});


initialiseChildrenView();


  initialiseTodayView({

    /*
      From the global Today screen,
      Add Task opens the global task modal.

      Because the user is already inside
      Today, today's date is prefilled.
    */

    onAddTask: () => {

      openDashboardTaskCreationFlow({
        defaultDueDate:
          getTodayDateString()
      });

    },


    /*
      Clicking a child from the Today screen
      still opens that exact child's profile.
    */

    onOpenChild: (
      childId
    ) => {

      changeAppView(
        'children'
      );


      openChildProfileById(
        childId
      );

    }

  });

  initialisePlannerView({

  /*
    Add Task from Planner opens the same
    global task modal.

    The selected planner date is passed
    automatically as the default due date.
  */

  onAddTask: ({
    defaultDueDate = ''
  } = {}) => {

    openDashboardTaskCreationFlow({
      defaultDueDate
    });

  },


  /*
    Clicking a child from a Planner task
    opens that exact child's profile.
  */

  onOpenChild: (
    childId
  ) => {

    changeAppView(
      'children'
    );


    openChildProfileById(
      childId
    );

  }

});

initialiseTomorrowView({

  /*
    Add for Tomorrow opens the existing
    global task modal.

    tomorrow.js already supplies tomorrow's
    date as defaultDueDate.
  */

  onAddTask: ({
    defaultDueDate = ''
  } = {}) => {

    openDashboardTaskCreationFlow({
      defaultDueDate
    });

  },


  /*
    Clicking a child from tomorrow's
    preparation view opens that exact
    child's detailed profile.
  */

  onOpenChild: (
    childId
  ) => {

    changeAppView(
      'children'
    );


    openChildProfileById(
      childId
    );

  }

});


  changeAppView(
    'dashboard'
  );


  return {

    changeView:
      changeAppView

  };

}


/* =========================================
   EXPORTED UTILITIES
========================================= */

export {
  changeAppView
};