import { auth, db } from './firebase.js';
import './children.css';
import './child-profile.css';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
  doc,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import {
  loadTasks,
  getTasks,
  getTasksForChild,
  createTask,
  updateTask,
  toggleTaskCompletion,
  deleteTask,
  getTodayDateString
} from './tasks.js';


/* =========================================
   FAMILYFLOW — CHILDREN VIEW
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let children = [];

let childrenAreLoading = false;

let editingChildId = null;

let openChildMenuId = null;

let pendingDeleteChildId = null;

let activeChildProfileId = null;

let activeChildProfileTab = 'overview';

let editingTaskId = null;

let pendingDeleteTaskId = null;

let taskActionInProgress = false;


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


  search: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="11" cy="11" r="7"></circle>
      <path d="m20 20-3.5-3.5"></path>
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
      <circle cx="12" cy="8" r="4"></circle>
      <path d="M5 21c0-4.2 3-7 7-7s7 2.8 7 7"></path>
    </svg>
  `,


  more: `
    <svg
      viewBox="0 0 24 24"
      fill="currentColor"
    >
      <circle cx="5" cy="12" r="1.5"></circle>
      <circle cx="12" cy="12" r="1.5"></circle>
      <circle cx="19" cy="12" r="1.5"></circle>
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
      <rect x="3" y="5" width="18" height="16" rx="3"></rect>
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
      <rect x="4" y="4" width="16" height="16" rx="3"></rect>
      <path d="m8 12 2.5 2.5L16 9"></path>
    </svg>
  `,


  chevron: `
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


  close: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
    >
      <path d="M18 6 6 18"></path>
      <path d="m6 6 12 12"></path>
    </svg>
  `,


  edit: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M12 20h9"></path>
      <path
        d="M16.5 3.5a2.121 2.121 0 0 1 3 3L8 18l-4 1 1-4Z"
      ></path>
    </svg>
  `,


  trash: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M3 6h18"></path>
      <path d="M8 6V4h8v2"></path>
      <path d="M19 6 18 20H6L5 6"></path>
      <path d="M10 11v5"></path>
      <path d="M14 11v5"></path>
    </svg>
  `,


  warning: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M10.3 2.9 1.8 17a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 2.9a2 2 0 0 0-3.4 0Z"
      ></path>
      <path d="M12 9v4"></path>
      <path d="M12 17h.01"></path>
    </svg>
  `

};


/* =========================================
   HELPERS
========================================= */

function notifyChildrenUpdated() {

  window.dispatchEvent(
    new CustomEvent(
      'familyflow:children-updated',
      {
        detail: {

          count:
            children.length,

          children:
            children.map(
              (child) => ({
                ...child
              })
            )

        }
      }
    )
  );

}


function escapeHtml(value = '') {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function getChildInitial(name = '') {

  const cleanName =
    String(name).trim();


  if (!cleanName) {
    return 'C';
  }


  return cleanName
    .charAt(0)
    .toUpperCase();

}


function getSafeChildColour(colour = 'green') {

  const allowedColours = [
    'green',
    'blue',
    'purple',
    'orange',
    'rose'
  ];


  return allowedColours.includes(colour)
    ? colour
    : 'green';

}


function findChildById(childId) {

  return children.find(
    (child) =>
      child.id === childId
  ) || null;

}


/* =========================================
   CHILD CARD
========================================= */

function createChildCard(child) {

  const id =
    escapeHtml(
      child.id || ''
    );


  const name =
    escapeHtml(
      child.name || 'Child'
    );


  const yearGroup =
    escapeHtml(
      child.yearGroup
      || 'Year group not added'
    );


  const notes =
    escapeHtml(
      child.notes
      || 'No notes added yet.'
    );


  const colour =
    getSafeChildColour(
      child.colour
    );


  const initial =
    escapeHtml(
      getChildInitial(
        child.name
      )
    );


  const taskCount =
    Number(
      child.taskCount || 0
    );


  const upcomingCount =
    Number(
      child.upcomingCount || 0
    );


  const menuIsOpen =
    openChildMenuId === child.id;


  return `
    <article
      class="child-card"
      data-child-id="${id}"
    >

      <div class="child-card-top">

        <div
          class="child-avatar child-avatar-${colour}"
        >
          <span>
            ${initial}
          </span>
        </div>


        <div class="child-card-menu-wrapper">

          <button
            type="button"
            class="child-card-menu-button"
            data-child-menu-toggle="${id}"
            aria-label="Open options for ${name}"
            aria-expanded="${menuIsOpen}"
          >
            ${icons.more}
          </button>


          <div
            class="child-card-action-menu ${menuIsOpen ? 'is-open' : ''}"
            data-child-action-menu="${id}"
            ${menuIsOpen ? '' : 'hidden'}
          >

            <button
              type="button"
              class="child-action-menu-item"
              data-edit-child="${id}"
            >

              <span class="child-action-menu-icon">
                ${icons.edit}
              </span>

              <span>
                Edit child
              </span>

            </button>


            <button
              type="button"
              class="child-action-menu-item child-action-menu-item-danger"
              data-delete-child="${id}"
            >

              <span class="child-action-menu-icon">
                ${icons.trash}
              </span>

              <span>
                Delete child
              </span>

            </button>

          </div>

        </div>

      </div>


      <div class="child-card-main">

        <span class="child-card-label">
          Child profile
        </span>

        <h3>
          ${name}
        </h3>

        <p class="child-year-group">
          ${yearGroup}
        </p>

      </div>


      <div class="child-card-stats">

        <div class="child-stat">

          <span class="child-stat-icon">
            ${icons.tasks}
          </span>

          <div>

            <strong>
              ${taskCount}
            </strong>

            <span>
              Tasks today
            </span>

          </div>

        </div>


        <div class="child-stat">

          <span class="child-stat-icon">
            ${icons.calendar}
          </span>

          <div>

            <strong>
              ${upcomingCount}
            </strong>

            <span>
              Upcoming
            </span>

          </div>

        </div>

      </div>


      <div class="child-card-note">

        <span>
          Notes
        </span>

        <p>
          ${notes}
        </p>

      </div>


      <button
        type="button"
        class="child-card-open-button"
        data-open-child="${id}"
      >

        <span>
          Open child profile
        </span>

        ${icons.chevron}

      </button>

    </article>
  `;

}


/* =========================================
   LOADING STATE
========================================= */

function createChildrenLoadingState() {

  return `
    <div class="children-loading-state">

      <div class="children-loading-spinner"></div>

      <strong>
        Loading your family
      </strong>

      <p>
        Getting your children's profiles ready...
      </p>

    </div>
  `;

}


/* =========================================
   EMPTY STATE
========================================= */

function createChildrenEmptyState() {

  return `
    <div class="children-empty-state">

      <div class="children-empty-visual">

        <div class="children-empty-main-icon">
          ${icons.child}
        </div>

        <span
          class="children-empty-dot dot-one"
        ></span>

        <span
          class="children-empty-dot dot-two"
        ></span>

        <span
          class="children-empty-dot dot-three"
        ></span>

      </div>


      <div class="children-empty-content">

        <span class="children-empty-eyebrow">
          Start with your family
        </span>

        <h2>
          Add your first child
        </h2>

        <p>
          Create a simple profile for each child so their tasks,
          routines, activities and daily plans stay organised
          separately.
        </p>


        <button
          type="button"
          class="children-primary-button"
          id="emptyAddChildButton"
        >
          ${icons.plus}

          <span>
            Add your first child
          </span>
        </button>

      </div>

    </div>
  `;

}


/* =========================================
   CHILDREN GRID
========================================= */

function createChildrenGrid() {

  if (childrenAreLoading) {
    return createChildrenLoadingState();
  }


  if (!children.length) {
    return createChildrenEmptyState();
  }


  return `
    <div class="children-grid">

      ${children
        .map(
          (child) =>
            createChildCard(child)
        )
        .join('')}

    </div>
  `;

}


/* =========================================
   ADD / EDIT CHILD MODAL
========================================= */

function createChildModal() {

  return `
    <div
      class="child-modal-backdrop"
      id="childModalBackdrop"
      hidden
    >

      <section
        class="child-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="childModalTitle"
      >

        <div class="child-modal-header">

          <div>

            <span
              class="child-modal-eyebrow"
              id="childModalEyebrow"
            >
              New child profile
            </span>

            <h2 id="childModalTitle">
              Add a child
            </h2>

            <p id="childModalDescription">
              Add only what you need. You can update the profile later.
            </p>

          </div>


          <button
            type="button"
            class="child-modal-close"
            id="childModalCloseButton"
            aria-label="Close child form"
          >
            ${icons.close}
          </button>

        </div>


        <form
          class="child-form"
          id="childForm"
        >

          <div class="child-form-group">

            <label for="childName">
              Child's name
            </label>

            <div class="child-input-wrapper">

              <span class="child-input-icon">
                ${icons.child}
              </span>

              <input
                type="text"
                id="childName"
                name="childName"
                placeholder="For example, Ahmed"
                maxlength="60"
                autocomplete="off"
                required
              >

            </div>

          </div>


          <div class="child-form-group">

            <label for="childYearGroup">
              Year group or class

              <span>
                Optional
              </span>
            </label>

            <div class="child-input-wrapper">

              <span class="child-input-icon">
                ${icons.calendar}
              </span>

              <input
                type="text"
                id="childYearGroup"
                name="childYearGroup"
                placeholder="For example, Year 4"
                maxlength="50"
                autocomplete="off"
              >

            </div>

          </div>


          <div class="child-form-group">

            <label>
              Profile colour
            </label>

            <div
              class="child-colour-picker"
              role="radiogroup"
              aria-label="Choose profile colour"
            >

              <label
                class="child-colour-option is-selected"
                data-colour-option="green"
              >

                <input
                  type="radio"
                  name="childColour"
                  value="green"
                  checked
                >

                <span
                  class="colour-swatch colour-green"
                ></span>

              </label>


              <label
                class="child-colour-option"
                data-colour-option="blue"
              >

                <input
                  type="radio"
                  name="childColour"
                  value="blue"
                >

                <span
                  class="colour-swatch colour-blue"
                ></span>

              </label>


              <label
                class="child-colour-option"
                data-colour-option="purple"
              >

                <input
                  type="radio"
                  name="childColour"
                  value="purple"
                >

                <span
                  class="colour-swatch colour-purple"
                ></span>

              </label>


              <label
                class="child-colour-option"
                data-colour-option="orange"
              >

                <input
                  type="radio"
                  name="childColour"
                  value="orange"
                >

                <span
                  class="colour-swatch colour-orange"
                ></span>

              </label>


              <label
                class="child-colour-option"
                data-colour-option="rose"
              >

                <input
                  type="radio"
                  name="childColour"
                  value="rose"
                >

                <span
                  class="colour-swatch colour-rose"
                ></span>

              </label>

            </div>

          </div>


          <div class="child-form-group">

            <label for="childNotes">
              Parent notes

              <span>
                Optional
              </span>
            </label>

            <textarea
              id="childNotes"
              name="childNotes"
              placeholder="Anything useful you want to remember..."
              maxlength="300"
              rows="4"
            ></textarea>

            <div class="child-textarea-footer">

              <span>
                Keep notes short and useful.
              </span>

              <span id="childNotesCounter">
                0 / 300
              </span>

            </div>

          </div>


          <div class="child-form-actions">

            <button
              type="button"
              class="child-secondary-button"
              id="childFormCancelButton"
            >
              Cancel
            </button>


            <button
              type="submit"
              class="children-primary-button"
              id="saveChildButton"
            >
              ${icons.plus}

              <span id="saveChildButtonText">
                Add child
              </span>
            </button>

          </div>

        </form>

      </section>

    </div>
  `;

}


/* =========================================
   DELETE CONFIRMATION MODAL
========================================= */

function createDeleteChildModal() {

  return `
    <div
      class="child-delete-backdrop"
      id="childDeleteBackdrop"
      hidden
    >

      <section
        class="child-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="childDeleteTitle"
      >

        <div class="child-delete-icon">
          ${icons.warning}
        </div>


        <div class="child-delete-content">

          <span class="child-delete-eyebrow">
            Permanent action
          </span>

          <h2 id="childDeleteTitle">
            Delete child?
          </h2>

          <p id="childDeleteMessage">
            This child profile will be permanently removed.
          </p>

        </div>


        <div class="child-delete-actions">

          <button
            type="button"
            class="child-secondary-button"
            id="cancelDeleteChildButton"
          >
            Cancel
          </button>


          <button
            type="button"
            class="child-danger-button"
            id="confirmDeleteChildButton"
          >
            ${icons.trash}

            <span>
              Delete child
            </span>
          </button>

        </div>

      </section>

    </div>
  `;

}
/* =========================================
   TASK MODAL
========================================= */

function createTaskModal() {

  return `
    <div
      class="child-modal-backdrop"
      id="taskModalBackdrop"
      hidden
    >

      <section
        class="child-modal child-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="taskModalTitle"
      >

        <div class="child-modal-header">

          <div>

            <span
              class="child-modal-eyebrow"
              id="taskModalEyebrow"
            >
              New task
            </span>

            <h2 id="taskModalTitle">
              Add a task
            </h2>

            <p id="taskModalDescription">
              Create something clear and useful for this child.
            </p>

          </div>


          <button
            type="button"
            class="child-modal-close"
            id="taskModalCloseButton"
            aria-label="Close task form"
          >
            ${icons.close}
          </button>

        </div>


        <form
          class="child-form"
          id="taskForm"
        >

          <input
            type="hidden"
            id="taskChildId"
          >


          <!-- TITLE -->

          <div class="child-form-group">

            <label for="taskTitle">
              Task title
            </label>

            <div class="child-input-wrapper">

              <span class="child-input-icon">
                ${icons.tasks}
              </span>

              <input
                type="text"
                id="taskTitle"
                placeholder="For example, Finish maths homework"
                maxlength="120"
                autocomplete="off"
                required
              >

            </div>

          </div>


          <!-- CATEGORY -->

          <div class="child-form-group">

            <label for="taskCategory">
              Category
            </label>

            <select
              id="taskCategory"
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


          <!-- DATE AND TIME -->

          <div class="child-task-form-row">

            <div class="child-form-group">

              <label for="taskDueDate">
                Due date

                <span>
                  Optional
                </span>
              </label>

              <input
                type="date"
                id="taskDueDate"
                class="child-task-plain-input"
              >

            </div>


            <div class="child-form-group">

              <label for="taskDueTime">
                Due time

                <span>
                  Optional
                </span>
              </label>

              <input
                type="time"
                id="taskDueTime"
                class="child-task-plain-input"
              >

            </div>

          </div>


          <!-- NOTES -->

          <div class="child-form-group">

            <label for="taskNotes">
              Task notes

              <span>
                Optional
              </span>
            </label>

            <textarea
              id="taskNotes"
              placeholder="Add any useful details..."
              maxlength="500"
              rows="4"
            ></textarea>

            <div class="child-textarea-footer">

              <span>
                Keep it clear and useful.
              </span>

              <span id="taskNotesCounter">
                0 / 500
              </span>

            </div>

          </div>


          <div
            id="taskFormStatus"
            hidden
          ></div>


          <div class="child-form-actions">

            <button
              type="button"
              class="child-secondary-button"
              id="taskFormCancelButton"
            >
              Cancel
            </button>


            <button
              type="submit"
              class="children-primary-button"
              id="saveTaskButton"
            >
              ${icons.plus}

              <span id="saveTaskButtonText">
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
   TASK DELETE CONFIRMATION
========================================= */

function createDeleteTaskModal() {

  return `
    <div
      class="child-delete-backdrop"
      id="taskDeleteBackdrop"
      hidden
    >

      <section
        class="child-delete-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="taskDeleteTitle"
      >

        <div class="child-delete-icon">
          ${icons.warning}
        </div>


        <div class="child-delete-content">

          <span class="child-delete-eyebrow">
            Permanent action
          </span>

          <h2 id="taskDeleteTitle">
            Delete task?
          </h2>

          <p id="taskDeleteMessage">
            This task will be permanently removed.
          </p>

        </div>


        <div class="child-delete-actions">

          <button
            type="button"
            class="child-secondary-button"
            id="cancelDeleteTaskButton"
          >
            Cancel
          </button>


          <button
            type="button"
            class="child-danger-button"
            id="confirmDeleteTaskButton"
          >
            ${icons.trash}

            <span>
              Delete task
            </span>
          </button>

        </div>

      </section>

    </div>
  `;

}

/* =========================================
   CHILD PROFILE — EMPTY PANEL
========================================= */

function createChildProfileEmptyPanel({
  eyebrow = '',
  title = '',
  message = '',
  actionLabel = ''
} = {}) {

  return `
    <div class="child-profile-empty-panel">

      <div class="child-profile-empty-icon">
        ${icons.child}
      </div>


      <div class="child-profile-empty-copy">

        ${
          eyebrow
            ? `
              <span class="child-profile-empty-eyebrow">
                ${escapeHtml(eyebrow)}
              </span>
            `
            : ''
        }


        <h3>
          ${escapeHtml(title)}
        </h3>


        <p>
          ${escapeHtml(message)}
        </p>

      </div>


      ${
        actionLabel
          ? `
            <button
              type="button"
              class="child-profile-empty-action"
              disabled
            >
              ${escapeHtml(actionLabel)}
            </button>
          `
          : ''
      }

    </div>
  `;

}


/* =========================================
   CHILD PROFILE — OVERVIEW TAB
========================================= */

function createChildProfileOverview(
  child
) {

  const notes =
    child.notes?.trim()
      ? escapeHtml(
          child.notes
        )
      : 'No parent notes have been added yet.';


  const todayTasks =
    getTodayTasksForChild(
      child.id
    );


  const upcomingTasks =
    getUpcomingTasksForChild(
      child.id
    );


  const visibleTodayTasks =
    todayTasks.slice(
      0,
      3
    );


  const visibleUpcomingTasks =
    upcomingTasks.slice(
      0,
      3
    );


  return `
    <div class="child-profile-overview-grid">

      <!-- =====================================
           TODAY
      ====================================== -->

      <section class="child-profile-panel">

        <div class="child-profile-panel-header">

          <div>

            <span>
              Today
            </span>

            <h3>
              Today's plan
            </h3>

          </div>


          <span class="child-profile-panel-count">
            ${todayTasks.length}
          </span>

        </div>


        ${
          todayTasks.length
            ? `
              <div class="child-task-list">

                ${visibleTodayTasks
                  .map(
                    (task) =>
                      createChildTaskCard(
                        task
                      )
                  )
                  .join('')}

              </div>


              ${
                todayTasks.length > 3
                  ? `
                    <button
                      type="button"
                      class="child-profile-empty-action"
                      data-child-profile-tab-link="today"
                    >
                      View all ${todayTasks.length} tasks
                    </button>
                  `
                  : ''
              }
            `
            : createChildProfileEmptyPanel({
                eyebrow:
                  'Nothing scheduled',

                title:
                  'A clear day so far',

                message:
                  `No tasks have been added for ${child.name || 'this child'} today.`,

                actionLabel:
                  'No tasks due today'
              })
        }

      </section>


      <!-- =====================================
           UPCOMING
      ====================================== -->

      <section class="child-profile-panel">

        <div class="child-profile-panel-header">

          <div>

            <span>
              Schedule
            </span>

            <h3>
              Coming up
            </h3>

          </div>


          <span class="child-profile-panel-count">
            ${upcomingTasks.length}
          </span>

        </div>


        ${
          upcomingTasks.length
            ? `
              <div class="child-task-list">

                ${visibleUpcomingTasks
                  .map(
                    (task) =>
                      createChildTaskCard(
                        task
                      )
                  )
                  .join('')}

              </div>


              ${
                upcomingTasks.length > 3
                  ? `
                    <button
                      type="button"
                      class="child-profile-empty-action"
                      data-child-profile-tab-link="tasks"
                    >
                      View all upcoming tasks
                    </button>
                  `
                  : ''
              }
            `
            : createChildProfileEmptyPanel({
                eyebrow:
                  'No upcoming tasks',

                title:
                  'Nothing scheduled ahead',

                message:
                  `Future tasks for ${child.name || 'this child'} will appear here automatically.`,

                actionLabel:
                  'No upcoming tasks'
              })
        }

      </section>


      <!-- =====================================
           TOMORROW PREPARATION
      ====================================== -->

      <section class="child-profile-panel">

        <div class="child-profile-panel-header">

          <div>

            <span>
              Prepare ahead
            </span>

            <h3>
              Tomorrow preparation
            </h3>

          </div>

        </div>


        ${createChildProfileEmptyPanel({
          eyebrow:
            'Nothing to prepare',

          title:
            'Tomorrow is clear',

          message:
            'Items such as school bags, kits, forms and reminders will appear here.'
        })}

      </section>


      <!-- =====================================
           NOTES
      ====================================== -->

      <section
        class="
          child-profile-panel
          child-profile-notes-panel
        "
      >

        <div class="child-profile-panel-header">

          <div>

            <span>
              Parent notes
            </span>

            <h3>
              Useful things to remember
            </h3>

          </div>


          <button
            type="button"
            class="child-profile-small-action"
            data-profile-edit-child="${escapeHtml(
              child.id
            )}"
          >
            ${icons.edit}

            <span>
              Edit
            </span>
          </button>

        </div>


        <div class="child-profile-note-content">

          <p>
            ${notes}
          </p>

        </div>

      </section>

    </div>
  `;

}


/* =========================================
   CHILD PROFILE — TODAY TAB
========================================= */

function createChildProfileTodayTab(
  child
) {

  const todayTasks =
    getTodayTasksForChild(
      child.id
    );


  const completedTasks =
    todayTasks.filter(
      (task) =>
        task.completed
    );


  const openTasks =
    todayTasks.filter(
      (task) =>
        !task.completed
    );


  return `
    <section
      class="
        child-profile-section
        child-tasks-section
      "
    >

      <div class="child-profile-section-heading">

        <div>

          <span>
            Daily focus
          </span>

          <h2>
            ${escapeHtml(child.name)}'s day
          </h2>

          <p>
            Everything due today for ${escapeHtml(
              child.name
            )}, collected in one clear place.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          data-add-task-child="${escapeHtml(
            child.id
          )}"
        >
          ${icons.plus}

          <span>
            Add task
          </span>
        </button>

      </div>


      <div class="child-task-summary">

        <div class="child-task-summary-item">

          <span>
            Today
          </span>

          <strong>
            ${todayTasks.length}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Still open
          </span>

          <strong>
            ${openTasks.length}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Completed
          </span>

          <strong>
            ${completedTasks.length}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Progress
          </span>

          <strong>
            ${
              todayTasks.length
                ? Math.round(
                    (
                      completedTasks.length
                      / todayTasks.length
                    )
                    * 100
                  )
                : 0
            }%
          </strong>

        </div>

      </div>


      ${
        todayTasks.length
          ? `
            <div class="child-task-list">

              ${todayTasks
                .map(
                  (task) =>
                    createChildTaskCard(
                      task
                    )
                )
                .join('')}

            </div>
          `
          : `
            <div class="child-tasks-empty">

              <div class="child-tasks-empty-icon">
                ${icons.tasks}
              </div>


              <span>
                Nothing due today
              </span>


              <h3>
                A clear day so far
              </h3>


              <p>
                There are currently no tasks due today for
                ${escapeHtml(child.name)}.
              </p>


              <button
                type="button"
                class="children-primary-button"
                data-add-task-child="${escapeHtml(
                  child.id
                )}"
              >
                ${icons.plus}

                <span>
                  Add today's first task
                </span>
              </button>

            </div>
          `
      }

    </section>
  `;

}


/* =========================================
   CHILD PROFILE — TASKS TAB
========================================= */

/* =========================================
   CHILD PROFILE — TASK HELPERS
========================================= */

function getTaskCategoryLabel(
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


function formatTaskDate(
  dateValue = ''
) {

  if (!dateValue) {
    return 'No due date';
  }


  const parts =
    String(dateValue)
      .split('-')
      .map(Number);


  if (parts.length !== 3) {
    return dateValue;
  }


  const [
    year,
    month,
    day
  ] = parts;


  const date =
    new Date(
      year,
      month - 1,
      day
    );


  return new Intl.DateTimeFormat(
    'en-GB',
    {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }
  ).format(date);

}


function formatTaskTime(
  timeValue = ''
) {

  if (!timeValue) {
    return '';
  }


  const [
    hours,
    minutes
  ] =
    timeValue
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


function getChildTasks(
  childId
) {

  return getTasksForChild(
    childId
  );

}

/* =========================================
   GET TODAY TASKS FOR CHILD
========================================= */

function getTodayTasksForChild(
  childId
) {

  const today =
    getTodayDateString();


  return getChildTasks(
    childId
  ).filter(
    (task) =>
      task.dueDate === today
  );

}


/* =========================================
   GET UPCOMING TASKS FOR CHILD
========================================= */

function getUpcomingTasksForChild(
  childId
) {

  const today =
    getTodayDateString();


  return getChildTasks(
    childId
  ).filter(
    (task) =>
      !task.completed
      && task.dueDate
      && task.dueDate > today
  );

}


function getChildTaskStats(
  childId
) {

  const childTasks =
    getChildTasks(
      childId
    );


  const completed =
    childTasks.filter(
      (task) =>
        task.completed
    ).length;


  const open =
    childTasks.length
    - completed;


  const today =
    getTodayDateString();


  const dueToday =
    childTasks.filter(
      (task) =>
        !task.completed
        && task.dueDate === today
    ).length;


  return {

    total:
      childTasks.length,

    open,

    completed,

    dueToday

  };

}


/* =========================================
   SYNCHRONISE CHILD TASK COUNTS
========================================= */

function synchroniseChildrenTaskCounts(
  allTasks = []
) {

  const today =
    getTodayDateString();


  children =
    children.map(
      (child) => {

        const taskCount =
          allTasks.filter(
            (task) =>
              task.childId === child.id
              && task.dueDate === today
              && !task.completed
          ).length;


        return {

          ...child,

          taskCount

        };

      }
    );


  notifyChildrenUpdated();

}


/* =========================================
   CREATE TASK CARD
========================================= */

function createChildTaskCard(
  task
) {

  const id =
    escapeHtml(
      task.id || ''
    );


  const title =
    escapeHtml(
      task.title || 'Untitled task'
    );


  const notes =
    escapeHtml(
      task.notes || ''
    );


  const category =
    escapeHtml(
      getTaskCategoryLabel(
        task.category
      )
    );


  const dueDate =
    formatTaskDate(
      task.dueDate
    );


  const dueTime =
    formatTaskTime(
      task.dueTime
    );


  const completed =
    Boolean(
      task.completed
    );


  return `
    <article
      class="
        child-task-card
        ${completed ? 'is-completed' : ''}
      "
      data-child-task-id="${id}"
    >

      <button
        type="button"
        class="
          child-task-complete-button
          ${completed ? 'is-completed' : ''}
        "
        data-toggle-task="${id}"
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
              child-task-category-${escapeHtml(
                task.category || 'general'
              )}
            "
          >
            ${category}
          </span>

        </div>


        ${
          notes
            ? `
              <p class="child-task-notes">
                ${notes}
              </p>
            `
            : ''
        }


        <div class="child-task-meta">

          <span>
            ${escapeHtml(dueDate)}
          </span>

          ${
            dueTime
              ? `
                <span>
                  ${escapeHtml(dueTime)}
                </span>
              `
              : ''
          }

        </div>

      </div>


      <div class="child-task-actions">

        <button
          type="button"
          class="child-task-action-button"
          data-edit-task="${id}"
          aria-label="Edit ${title}"
        >
          ${icons.edit}
        </button>


        <button
          type="button"
          class="
            child-task-action-button
            child-task-action-danger
          "
          data-delete-task="${id}"
          aria-label="Delete ${title}"
        >
          ${icons.trash}
        </button>

      </div>

    </article>
  `;

}


/* =========================================
   CHILD PROFILE — TASKS TAB
========================================= */

function createChildProfileTasksTab(
  child
) {

  const childTasks =
    getChildTasks(
      child.id
    );


  const stats =
    getChildTaskStats(
      child.id
    );


  return `
    <section
      class="child-profile-section child-tasks-section"
    >

      <div class="child-profile-section-heading">

        <div>

          <span>
            Individual tasks
          </span>

          <h2>
            ${escapeHtml(child.name)}'s tasks
          </h2>

          <p>
            Manage homework, chores, reminders and other tasks
            specifically for ${escapeHtml(child.name)}.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="addTaskForChildButton"
          data-add-task-child="${escapeHtml(
            child.id
          )}"
        >
          ${icons.plus}

          <span>
            Add task
          </span>
        </button>

      </div>


      <div class="child-task-summary">

        <div class="child-task-summary-item">

          <span>
            Total
          </span>

          <strong>
            ${stats.total}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Due today
          </span>

          <strong>
            ${stats.dueToday}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Open
          </span>

          <strong>
            ${stats.open}
          </strong>

        </div>


        <div class="child-task-summary-item">

          <span>
            Completed
          </span>

          <strong>
            ${stats.completed}
          </strong>

        </div>

      </div>


      ${
        childTasks.length
          ? `
            <div class="child-task-list">

              ${childTasks
                .map(
                  (task) =>
                    createChildTaskCard(
                      task
                    )
                )
                .join('')}

            </div>
          `
          : `
            <div class="child-tasks-empty">

              <div class="child-tasks-empty-icon">
                ${icons.tasks}
              </div>


              <span>
                No tasks yet
              </span>


              <h3>
                Start with something useful
              </h3>


              <p>
                Add homework, chores, reminders or anything else
                ${escapeHtml(child.name)} needs to remember.
              </p>


              <button
                type="button"
                class="children-primary-button"
                data-add-task-child="${escapeHtml(
                  child.id
                )}"
              >
                ${icons.plus}

                <span>
                  Add first task
                </span>
              </button>

            </div>
          `
      }

    </section>
  `;

}


/* =========================================
   CHILD PROFILE — PLANNER TAB
========================================= */

function createChildProfilePlannerTab(child) {

  return `
    <section class="child-profile-section">

      <div class="child-profile-section-heading">

        <div>

          <span>
            Schedule
          </span>

          <h2>
            ${escapeHtml(child.name)}'s planner
          </h2>

          <p>
            School events, clubs, appointments and other plans will live here.
          </p>

        </div>

      </div>


      ${createChildProfileEmptyPanel({
        eyebrow: 'No plans yet',
        title: 'The calendar is clear',
        message:
          `Upcoming events and activities assigned to ${child.name || 'this child'} will appear here.`,
        actionLabel: 'Planner system coming next'
      })}

    </section>
  `;

}


/* =========================================
   CHILD PROFILE — ROUTINES TAB
========================================= */

function createChildProfileRoutinesTab(child) {

  return `
    <section class="child-profile-section">

      <div class="child-profile-section-heading">

        <div>

          <span>
            Repeating activities
          </span>

          <h2>
            ${escapeHtml(child.name)}'s routines
          </h2>

          <p>
            Morning routines, bedtime habits and recurring responsibilities will be organised here.
          </p>

        </div>

      </div>


      ${createChildProfileEmptyPanel({
        eyebrow: 'No routines yet',
        title: 'Build helpful habits',
        message:
          `Recurring routines for ${child.name || 'this child'} will be shown here once created.`,
        actionLabel: 'Routines coming later'
      })}

    </section>
  `;

}


/* =========================================
   CHILD PROFILE — NOTES TAB
========================================= */

function createChildProfileNotesTab(child) {

  const notes =
    child.notes?.trim()
      ? escapeHtml(child.notes)
      : 'No parent notes have been added yet.';


  return `
    <section class="child-profile-section">

      <div class="child-profile-section-heading child-profile-notes-heading">

        <div>

          <span>
            Private parent notes
          </span>

          <h2>
            Notes about ${escapeHtml(child.name)}
          </h2>

          <p>
            Keep useful information in one place without cluttering the daily planner.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button child-profile-edit-notes-button"
          data-profile-edit-child="${escapeHtml(child.id)}"
        >
          ${icons.edit}

          <span>
            Edit notes
          </span>
        </button>

      </div>


      <div class="child-profile-large-note">

        <span class="child-profile-large-note-label">
          Parent notes
        </span>

        <p>
          ${notes}
        </p>

      </div>

    </section>
  `;

}


/* =========================================
   CHILD PROFILE — ACTIVE TAB CONTENT
========================================= */

function createChildProfileTabContent(child) {

  switch (activeChildProfileTab) {

    case 'today':

      return createChildProfileTodayTab(
        child
      );


    case 'tasks':

      return createChildProfileTasksTab(
        child
      );


    case 'planner':

      return createChildProfilePlannerTab(
        child
      );


    case 'routines':

      return createChildProfileRoutinesTab(
        child
      );


    case 'notes':

      return createChildProfileNotesTab(
        child
      );


    case 'overview':

    default:

      return createChildProfileOverview(
        child
      );

  }

}


/* =========================================
   CHILD PROFILE — COMPLETE VIEW
========================================= */

function createChildProfileView(child) {

    const taskStats =
  getChildTaskStats(
    child.id
  );


const upcomingTasks =
  getUpcomingTasksForChild(
    child.id
  );

  const id =
    escapeHtml(
      child.id || ''
    );


  const name =
    escapeHtml(
      child.name || 'Child'
    );


  const yearGroup =
    escapeHtml(
      child.yearGroup
      || 'Year group not added'
    );


  const colour =
    getSafeChildColour(
      child.colour
    );


  const initial =
    escapeHtml(
      getChildInitial(
        child.name
      )
    );


  const tabs = [
    {
      id: 'overview',
      label: 'Overview'
    },
    {
      id: 'today',
      label: 'Today'
    },
    {
      id: 'tasks',
      label: 'Tasks'
    },
    {
      id: 'planner',
      label: 'Planner'
    },
    {
      id: 'routines',
      label: 'Routines'
    },
    {
      id: 'notes',
      label: 'Notes'
    }
  ];


  return `
    <div
      class="child-profile-view"
      data-active-child-profile="${id}"
    >

      <!-- TOP BAR -->

      <div class="child-profile-topbar">

        <button
          type="button"
          class="child-profile-back-button"
          id="backToChildrenButton"
        >

          <span class="child-profile-back-arrow">
            ←
          </span>

          <span>
            Back to children
          </span>

        </button>


        <button
          type="button"
          class="child-profile-edit-button"
          data-profile-edit-child="${id}"
        >
          ${icons.edit}

          <span>
            Edit profile
          </span>
        </button>

      </div>


      <!-- PROFILE HERO -->

      <section class="child-profile-hero">

        <div
          class="
            child-profile-avatar
            child-profile-avatar-${colour}
          "
        >
          ${initial}
        </div>


        <div class="child-profile-identity">

          <span class="child-profile-eyebrow">
            Child profile
          </span>

          <h1>
            ${name}
          </h1>

          <p>
            ${yearGroup}
          </p>

        </div>


        <div class="child-profile-hero-message">

          <span>
            FamilyFlow workspace
          </span>

          <p>
            Everything for ${name}, organised in one place.
          </p>

        </div>

      </section>


      <!-- SUMMARY METRICS -->

      <div class="child-profile-metrics">

<div class="child-profile-metric">

  <span>
    Tasks today
  </span>

  <strong>
    ${taskStats.dueToday}
  </strong>

  <small>
    ${
      taskStats.dueToday === 0
        ? 'Nothing due today'
        : taskStats.dueToday === 1
          ? '1 open task today'
          : `${taskStats.dueToday} open tasks today`
    }
  </small>

</div>


       <div class="child-profile-metric">

  <span>
    Upcoming
  </span>

  <strong>
    ${upcomingTasks.length}
  </strong>

  <small>
    ${
      upcomingTasks.length === 0
        ? 'Nothing scheduled ahead'
        : upcomingTasks.length === 1
          ? '1 future task'
          : `${upcomingTasks.length} future tasks`
    }
  </small>

</div>


        <div class="child-profile-metric">

          <span>
            Tomorrow prep
          </span>

          <strong>
            0
          </strong>

          <small>
            Nothing to prepare yet
          </small>

        </div>


        <div class="child-profile-metric">

          <span>
            Active routines
          </span>

          <strong>
            0
          </strong>

          <small>
            No routines created yet
          </small>

        </div>

      </div>


      <!-- PROFILE TABS -->

      <nav
        class="child-profile-tabs"
        aria-label="${name}'s profile sections"
      >

        ${tabs
          .map((tab) => {

            const isActive =
              activeChildProfileTab
              === tab.id;


            return `
              <button
                type="button"
                class="
                  child-profile-tab
                  ${isActive ? 'is-active' : ''}
                "
                data-child-profile-tab="${tab.id}"
                aria-selected="${isActive}"
              >
                ${tab.label}
              </button>
            `;

          })
          .join('')}

      </nav>


      <!-- TAB CONTENT -->

      <div
        class="child-profile-tab-content"
        id="childProfileTabContent"
      >
        ${createChildProfileTabContent(child)}
      </div>

    </div>
  `;

}


/* =========================================
   OPEN CHILD PROFILE
========================================= */

function openChildProfile(childId) {

  const child =
    findChildById(
      childId
    );


  if (!child) {

    console.warn(
      'Could not open child profile because the child was not found:',
      childId
    );


    return;

  }


  activeChildProfileId =
    child.id;


  activeChildProfileTab =
    'overview';


  const pageHeader =
    document.querySelector(
      '.children-page-header'
    );


  const toolbar =
    document.querySelector(
      '#childrenToolbar'
    );


  const content =
    document.querySelector(
      '#childrenContent'
    );


  const profileContainer =
    document.querySelector(
      '#childProfileContainer'
    );


  if (pageHeader) {
    pageHeader.hidden =
      true;
  }


  if (toolbar) {
    toolbar.hidden =
      true;
  }


  if (content) {
    content.hidden =
      true;
  }


  if (!profileContainer) {
    return;
  }


  profileContainer.innerHTML =
    createChildProfileView(
      child
    );


  profileContainer.hidden =
    false;


  attachChildProfileListeners();


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


/* =========================================
   CLOSE CHILD PROFILE
========================================= */

function closeChildProfile() {

  activeChildProfileId =
    null;


  activeChildProfileTab =
    'overview';


  const pageHeader =
    document.querySelector(
      '.children-page-header'
    );


  const content =
    document.querySelector(
      '#childrenContent'
    );


  const profileContainer =
    document.querySelector(
      '#childProfileContainer'
    );


  if (pageHeader) {
    pageHeader.hidden =
      false;
  }


  if (content) {
    content.hidden =
      false;
  }


  if (profileContainer) {

    profileContainer.hidden =
      true;


    profileContainer.innerHTML =
      '';

  }


  refreshChildrenContent();


  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });

}


/* =========================================
   REFRESH ACTIVE CHILD PROFILE
========================================= */

function refreshActiveChildProfile() {

  if (!activeChildProfileId) {
    return;
  }


  const child =
    findChildById(
      activeChildProfileId
    );


  if (!child) {

    closeChildProfile();


    return;

  }


  const profileContainer =
    document.querySelector(
      '#childProfileContainer'
    );


  if (!profileContainer) {
    return;
  }


  profileContainer.innerHTML =
    createChildProfileView(
      child
    );


  profileContainer.hidden =
    false;


  attachChildProfileListeners();

}

/* =========================================
   TASK FORM STATUS
========================================= */

function showTaskFormStatus(
  message,
  type = 'info'
) {

  const status =
    document.querySelector(
      '#taskFormStatus'
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


function clearTaskFormStatus() {

  const status =
    document.querySelector(
      '#taskFormStatus'
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
   TASK NOTES COUNTER
========================================= */

function updateTaskNotesCounter() {

  const notesInput =
    document.querySelector(
      '#taskNotes'
    );


  const counter =
    document.querySelector(
      '#taskNotesCounter'
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
   OPEN ADD TASK MODAL
========================================= */

function openAddTaskModal(
  childId
) {

  const child =
    findChildById(
      childId
    );


  if (!child) {
    return;
  }


  editingTaskId =
    null;


  const form =
    document.querySelector(
      '#taskForm'
    );


  form?.reset();


  clearTaskFormStatus();


  const childIdInput =
    document.querySelector(
      '#taskChildId'
    );


  const title =
    document.querySelector(
      '#taskModalTitle'
    );


  const eyebrow =
    document.querySelector(
      '#taskModalEyebrow'
    );


  const description =
    document.querySelector(
      '#taskModalDescription'
    );


  const buttonText =
    document.querySelector(
      '#saveTaskButtonText'
    );


  if (childIdInput) {
    childIdInput.value =
      child.id;
  }


  if (eyebrow) {
    eyebrow.textContent =
      'New task';
  }


  if (title) {
    title.textContent =
      `Add task for ${child.name}`;
  }


  if (description) {
    description.textContent =
      `Create a clear task specifically for ${child.name}.`;
  }


  if (buttonText) {
    buttonText.textContent =
      'Add task';
  }


  updateTaskNotesCounter();


  openTaskModalBackdrop();

}


/* =========================================
   OPEN EDIT TASK MODAL
========================================= */

function openEditTaskModal(
  taskId
) {

  const child =
    findChildById(
      activeChildProfileId
    );


  if (!child) {
    return;
  }


  const task =
    getChildTasks(
      child.id
    ).find(
      (item) =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  editingTaskId =
    task.id;


  clearTaskFormStatus();


  const childIdInput =
    document.querySelector(
      '#taskChildId'
    );


  const titleInput =
    document.querySelector(
      '#taskTitle'
    );


  const notesInput =
    document.querySelector(
      '#taskNotes'
    );


  const categoryInput =
    document.querySelector(
      '#taskCategory'
    );


  const dueDateInput =
    document.querySelector(
      '#taskDueDate'
    );


  const dueTimeInput =
    document.querySelector(
      '#taskDueTime'
    );


  const modalTitle =
    document.querySelector(
      '#taskModalTitle'
    );


  const eyebrow =
    document.querySelector(
      '#taskModalEyebrow'
    );


  const description =
    document.querySelector(
      '#taskModalDescription'
    );


  const buttonText =
    document.querySelector(
      '#saveTaskButtonText'
    );


  if (childIdInput) {
    childIdInput.value =
      child.id;
  }


  if (titleInput) {
    titleInput.value =
      task.title || '';
  }


  if (notesInput) {
    notesInput.value =
      task.notes || '';
  }


  if (categoryInput) {
    categoryInput.value =
      task.category || 'general';
  }


  if (dueDateInput) {
    dueDateInput.value =
      task.dueDate || '';
  }


  if (dueTimeInput) {
    dueTimeInput.value =
      task.dueTime || '';
  }


  if (eyebrow) {
    eyebrow.textContent =
      'Edit task';
  }


  if (modalTitle) {
    modalTitle.textContent =
      `Edit ${task.title}`;
  }


  if (description) {
    description.textContent =
      `Update this task for ${child.name}.`;
  }


  if (buttonText) {
    buttonText.textContent =
      'Save changes';
  }


  updateTaskNotesCounter();


  openTaskModalBackdrop();

}


/* =========================================
   OPEN TASK MODAL BACKDROP
========================================= */

function openTaskModalBackdrop() {

  const backdrop =
    document.querySelector(
      '#taskModalBackdrop'
    );


  if (!backdrop) {
    return;
  }


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
      .querySelector('#taskTitle')
      ?.focus();

  }, 180);

}


/* =========================================
   CLOSE TASK MODAL
========================================= */

function closeTaskModal() {

  const backdrop =
    document.querySelector(
      '#taskModalBackdrop'
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


    editingTaskId =
      null;


    clearTaskFormStatus();

  }, 220);

}


/* =========================================
   SUBMIT TASK FORM
========================================= */

async function handleTaskFormSubmit(
  event
) {

  event.preventDefault();


  if (taskActionInProgress) {
    return;
  }


  const childId =
    document
      .querySelector('#taskChildId')
      ?.value.trim()
    || '';


  const title =
    document
      .querySelector('#taskTitle')
      ?.value.trim()
    || '';


  const notes =
    document
      .querySelector('#taskNotes')
      ?.value.trim()
    || '';


  const category =
    document
      .querySelector('#taskCategory')
      ?.value
    || 'general';


  const dueDate =
    document
      .querySelector('#taskDueDate')
      ?.value
    || '';


  const dueTime =
    document
      .querySelector('#taskDueTime')
      ?.value
    || '';


  const saveButton =
    document.querySelector(
      '#saveTaskButton'
    );


  if (title.length < 2) {

    showTaskFormStatus(
      'Please enter a task title.',
      'error'
    );


    document
      .querySelector('#taskTitle')
      ?.focus();


    return;

  }


  const isEditing =
    Boolean(editingTaskId);


  const originalButtonHtml =
    saveButton?.innerHTML || '';


  try {

    taskActionInProgress =
      true;


    if (saveButton) {

      saveButton.disabled =
        true;


      saveButton.innerHTML = `
        <span>
          ${
            isEditing
              ? 'Saving changes...'
              : 'Adding task...'
          }
        </span>
      `;

    }


    showTaskFormStatus(
      isEditing
        ? 'Saving task changes...'
        : 'Saving task...',
      'info'
    );


    if (isEditing) {

      await updateTask(
        editingTaskId,
        {
          title,
          notes,
          category,
          dueDate,
          dueTime
        }
      );


      showTaskFormStatus(
        'Task updated successfully.',
        'success'
      );

    } else {

      await createTask({
        childId,
        title,
        notes,
        category,
        dueDate,
        dueTime
      });


      showTaskFormStatus(
        'Task added successfully.',
        'success'
      );

    }


    setTimeout(() => {

      closeTaskModal();


      refreshActiveChildProfile();

    }, 500);

  } catch (error) {

    console.error(
      'Task save failed:',
      error
    );


    showTaskFormStatus(
      error?.message
      || 'We could not save this task. Please try again.',
      'error'
    );

  } finally {

    taskActionInProgress =
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
   TOGGLE TASK COMPLETION
========================================= */

async function handleTaskCompletionToggle(
  taskId
) {

  if (taskActionInProgress) {
    return;
  }


  const child =
    findChildById(
      activeChildProfileId
    );


  if (!child) {
    return;
  }


  const task =
    getChildTasks(
      child.id
    ).find(
      (item) =>
        item.id === taskId
    );


  if (!task) {
    return;
  }


  try {

    taskActionInProgress =
      true;


    await toggleTaskCompletion(
      task.id,
      !task.completed
    );


    refreshActiveChildProfile();

  } catch (error) {

    console.error(
      'Failed to update task completion:',
      error
    );

  } finally {

    taskActionInProgress =
      false;

  }

}


/* =========================================
   DELETE TASK DIALOG
========================================= */

function openDeleteTaskDialog(
  taskId
) {

  const child =
    findChildById(
      activeChildProfileId
    );


  if (!child) {
    return;
  }


  const task =
    getChildTasks(
      child.id
    ).find(
      (item) =>
        item.id === taskId
    );


  const backdrop =
    document.querySelector(
      '#taskDeleteBackdrop'
    );


  if (
    !task
    || !backdrop
  ) {
    return;
  }


  pendingDeleteTaskId =
    task.id;


  const title =
    document.querySelector(
      '#taskDeleteTitle'
    );


  const message =
    document.querySelector(
      '#taskDeleteMessage'
    );


  if (title) {
    title.textContent =
      `Delete "${task.title}"?`;
  }


  if (message) {
    message.textContent =
      'This task will be permanently removed. This action cannot be undone.';
  }


  backdrop.hidden =
    false;


  document.body.classList.add(
    'child-delete-open'
  );


  requestAnimationFrame(() => {

    backdrop.classList.add(
      'is-visible'
    );

  });

}


function closeDeleteTaskDialog() {

  const backdrop =
    document.querySelector(
      '#taskDeleteBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'child-delete-open'
  );


  setTimeout(() => {

    backdrop.hidden =
      true;


    pendingDeleteTaskId =
      null;

  }, 220);

}


async function handleDeleteTask() {

  if (
    !pendingDeleteTaskId
    || taskActionInProgress
  ) {
    return;
  }


  const confirmButton =
    document.querySelector(
      '#confirmDeleteTaskButton'
    );


  const originalButtonHtml =
    confirmButton?.innerHTML || '';


  try {

    taskActionInProgress =
      true;


    if (confirmButton) {

      confirmButton.disabled =
        true;


      confirmButton.innerHTML = `
        <span>
          Deleting...
        </span>
      `;

    }


    await deleteTask(
      pendingDeleteTaskId
    );


    closeDeleteTaskDialog();


    refreshActiveChildProfile();

  } catch (error) {

    console.error(
      'Failed to delete task:',
      error
    );


    const message =
      document.querySelector(
        '#taskDeleteMessage'
      );


    if (message) {
      message.textContent =
        'We could not delete this task. Please try again.';
    }

  } finally {

    taskActionInProgress =
      false;


    if (confirmButton) {

      confirmButton.disabled =
        false;


      confirmButton.innerHTML =
        originalButtonHtml;

    }

  }

}
/* =========================================
   ATTACH CHILD PROFILE LISTENERS
========================================= */

function attachChildProfileListeners() {

  const backButton =
    document.querySelector(
      '#backToChildrenButton'
    );


  backButton?.addEventListener(
    'click',
    closeChildProfile
  );


  document
    .querySelectorAll(
      '[data-profile-edit-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          openEditChildModal(
            button.dataset.profileEditChild
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-child-profile-tab]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        () => {

          const requestedTab =
            button.dataset
              .childProfileTab;


          const allowedTabs = [
            'overview',
            'today',
            'tasks',
            'planner',
            'routines',
            'notes'
          ];


          if (
            !allowedTabs.includes(
              requestedTab
            )
          ) {
            return;
          }


          activeChildProfileTab =
            requestedTab;


          refreshActiveChildProfile();

        }
      );

    });

    /* -----------------------------------------
   ADD TASK
----------------------------------------- */

document
  .querySelectorAll(
    '[data-add-task-child]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        openAddTaskModal(
          button.dataset.addTaskChild
        );

      }
    );

  });


/* -----------------------------------------
   COMPLETE TASK
----------------------------------------- */

document
  .querySelectorAll(
    '[data-toggle-task]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        handleTaskCompletionToggle(
          button.dataset.toggleTask
        );

      }
    );

  });


/* -----------------------------------------
   EDIT TASK
----------------------------------------- */

document
  .querySelectorAll(
    '[data-edit-task]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        openEditTaskModal(
          button.dataset.editTask
        );

      }
    );

  });


/* -----------------------------------------
   DELETE TASK
----------------------------------------- */

document
  .querySelectorAll(
    '[data-delete-task]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        openDeleteTaskDialog(
          button.dataset.deleteTask
        );

      }
    );

  });

  /* -----------------------------------------
   PROFILE TAB LINKS
----------------------------------------- */

document
  .querySelectorAll(
    '[data-child-profile-tab-link]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        const requestedTab =
          button.dataset
            .childProfileTabLink;


        const allowedTabs = [
          'overview',
          'today',
          'tasks',
          'planner',
          'routines',
          'notes'
        ];


        if (
          !allowedTabs.includes(
            requestedTab
          )
        ) {
          return;
        }


        activeChildProfileTab =
          requestedTab;


        refreshActiveChildProfile();

      }
    );

  });

}


/* =========================================
   PUBLIC CHILD PROFILE OPENER
========================================= */

export function openChildProfileById(
  childId
) {

  openChildProfile(
    childId
  );

}

/* =========================================
   COMPLETE CHILDREN VIEW
========================================= */

export function createChildrenView() {

  return `
    <section
      class="app-view children-view"
      data-app-view="children"
      hidden
    >

      <div class="children-page-header">

        <div>

          <span class="children-page-eyebrow">
            Your family
          </span>

          <h1>
            Children
          </h1>

          <p>
            Keep every child's tasks, routines and plans organised
            in their own space.
          </p>

        </div>


        <button
          type="button"
          class="children-primary-button"
          id="addChildButton"
        >
          ${icons.plus}

          <span>
            Add child
          </span>
        </button>

      </div>


      


<div
  class="children-content"
  id="childrenContent"
>
  ${createChildrenGrid()}
</div>


<!-- INDIVIDUAL CHILD PROFILE -->

<div
  class="child-profile-container"
  id="childProfileContainer"
  hidden
></div>


${createChildModal()}

${createDeleteChildModal()}

${createTaskModal()}

${createDeleteTaskModal()}

    </section>
  `;

}


/* =========================================
   RESET CHILD FORM STATUS
========================================= */

function clearChildFormStatus() {

  const status =
    document.querySelector(
      '#childFormStatus'
    );


  status?.remove();

}


/* =========================================
   OPEN ADD CHILD MODAL
========================================= */

function openAddChildModal() {

  editingChildId =
    null;


  const form =
    document.querySelector(
      '#childForm'
    );


  form?.reset();


  clearChildFormStatus();


  const eyebrow =
    document.querySelector(
      '#childModalEyebrow'
    );


  const title =
    document.querySelector(
      '#childModalTitle'
    );


  const description =
    document.querySelector(
      '#childModalDescription'
    );


  const buttonText =
    document.querySelector(
      '#saveChildButtonText'
    );


  if (eyebrow) {
    eyebrow.textContent =
      'New child profile';
  }


  if (title) {
    title.textContent =
      'Add a child';
  }


  if (description) {
    description.textContent =
      'Add only what you need. You can update the profile later.';
  }


  if (buttonText) {
    buttonText.textContent =
      'Add child';
  }


  const greenInput =
    document.querySelector(
      'input[name="childColour"][value="green"]'
    );


  if (greenInput) {
    greenInput.checked =
      true;
  }


  updateColourPicker();

  updateNotesCounter();


  openChildModalBackdrop();

}


/* =========================================
   OPEN EDIT CHILD MODAL
========================================= */

function openEditChildModal(childId) {

  const child =
    findChildById(childId);


  if (!child) {
    return;
  }


  editingChildId =
    child.id;


  clearChildFormStatus();


  const nameInput =
    document.querySelector(
      '#childName'
    );


  const yearGroupInput =
    document.querySelector(
      '#childYearGroup'
    );


  const notesInput =
    document.querySelector(
      '#childNotes'
    );


  const colourInput =
    document.querySelector(
      `input[name="childColour"][value="${getSafeChildColour(
        child.colour
      )}"]`
    );


  const eyebrow =
    document.querySelector(
      '#childModalEyebrow'
    );


  const title =
    document.querySelector(
      '#childModalTitle'
    );


  const description =
    document.querySelector(
      '#childModalDescription'
    );


  const buttonText =
    document.querySelector(
      '#saveChildButtonText'
    );


  if (nameInput) {
    nameInput.value =
      child.name || '';
  }


  if (yearGroupInput) {
    yearGroupInput.value =
      child.yearGroup || '';
  }


  if (notesInput) {
    notesInput.value =
      child.notes || '';
  }


  if (colourInput) {
    colourInput.checked =
      true;
  }


  if (eyebrow) {
    eyebrow.textContent =
      'Edit child profile';
  }


  if (title) {
    title.textContent =
      `Edit ${child.name || 'child'}`;
  }


  if (description) {
    description.textContent =
      'Update this child’s details and save your changes.';
  }


  if (buttonText) {
    buttonText.textContent =
      'Save changes';
  }


  updateColourPicker();

  updateNotesCounter();


  openChildModalBackdrop();

}


/* =========================================
   OPEN CHILD MODAL BACKDROP
========================================= */

function openChildModalBackdrop() {

  const backdrop =
    document.querySelector(
      '#childModalBackdrop'
    );


  const childNameInput =
    document.querySelector(
      '#childName'
    );


  if (!backdrop) {
    return;
  }


  closeAllChildMenus();


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

    childNameInput?.focus();

  }, 180);

}


/* =========================================
   CLOSE CHILD MODAL
========================================= */

function closeChildModal() {

  const backdrop =
    document.querySelector(
      '#childModalBackdrop'
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


    editingChildId =
      null;


    clearChildFormStatus();

  }, 220);

}


/* =========================================
   CHILD CARD MENU
========================================= */

function toggleChildMenu(childId) {

  openChildMenuId =
    openChildMenuId === childId
      ? null
      : childId;


  refreshChildrenContent();

}


function closeAllChildMenus() {

  if (!openChildMenuId) {
    return;
  }


  openChildMenuId =
    null;


  refreshChildrenContent();

}


/* =========================================
   DELETE CONFIRMATION
========================================= */

function openDeleteChildDialog(childId) {

  const child =
    findChildById(childId);


  const backdrop =
    document.querySelector(
      '#childDeleteBackdrop'
    );


  const title =
    document.querySelector(
      '#childDeleteTitle'
    );


  const message =
    document.querySelector(
      '#childDeleteMessage'
    );


  if (
    !child
    || !backdrop
  ) {
    return;
  }


  pendingDeleteChildId =
    child.id;


  closeAllChildMenus();


  if (title) {
    title.textContent =
      `Delete ${child.name}?`;
  }


  if (message) {

    message.textContent =
      `This will permanently remove ${child.name}'s profile. This action cannot be undone.`;

  }


  backdrop.hidden =
    false;


  document.body.classList.add(
    'child-delete-open'
  );


  requestAnimationFrame(() => {

    backdrop.classList.add(
      'is-visible'
    );

  });

}


function closeDeleteChildDialog() {

  const backdrop =
    document.querySelector(
      '#childDeleteBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'child-delete-open'
  );


  setTimeout(() => {

    backdrop.hidden =
      true;


    pendingDeleteChildId =
      null;

  }, 220);

}


/* =========================================
   UPDATE COLOUR PICKER
========================================= */

function updateColourPicker() {

  document
    .querySelectorAll(
      '.child-colour-option'
    )
    .forEach((option) => {

      const input =
        option.querySelector(
          'input[type="radio"]'
        );


      option.classList.toggle(
        'is-selected',
        Boolean(input?.checked)
      );

    });

}


/* =========================================
   UPDATE NOTES COUNTER
========================================= */

function updateNotesCounter() {

  const textarea =
    document.querySelector(
      '#childNotes'
    );


  const counter =
    document.querySelector(
      '#childNotesCounter'
    );


  if (
    !textarea
    || !counter
  ) {
    return;
  }


  counter.textContent =
    `${textarea.value.length} / 300`;

}


/* =========================================
   FILTER CHILDREN
========================================= */

function filterChildren(query = '') {

  const normalisedQuery =
    String(query)
      .trim()
      .toLowerCase();


  const cards =
    document.querySelectorAll(
      '.child-card'
    );


  let visibleCount =
    0;


  cards.forEach((card) => {

    const childId =
      card.dataset.childId;


    const child =
      findChildById(childId);


    if (!child) {

      card.hidden =
        true;


      return;

    }


    const searchableText = [
      child.name,
      child.yearGroup,
      child.notes
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();


    const shouldShow =
      searchableText.includes(
        normalisedQuery
      );


    card.hidden =
      !shouldShow;


    if (shouldShow) {
      visibleCount += 1;
    }

  });


  const visibleCountElement =
    document.querySelector(
      '#visibleChildrenCount'
    );


  if (visibleCountElement) {

    visibleCountElement.textContent =
      String(visibleCount);

  }

}


/* =========================================
   LOAD CHILDREN FROM FIRESTORE
========================================= */

async function loadChildrenFromFirestore() {

  const user =
    auth.currentUser;


  if (!user) {

    console.warn(
      'Cannot load children because no authenticated user was found.'
    );


    childrenAreLoading =
      false;


    refreshChildrenContent();


    return;

  }


  childrenAreLoading =
    true;


  refreshChildrenContent();


  try {

    const childrenCollection =
      collection(
        db,
        'users',
        user.uid,
        'children'
      );


    const childrenQuery =
      query(
        childrenCollection,
        orderBy(
          'createdAt',
          'asc'
        )
      );


    const snapshot =
      await getDocs(
        childrenQuery
      );


    children =
      snapshot.docs.map(
        (documentSnapshot) => {

          const data =
            documentSnapshot.data();


          return {

            id:
              documentSnapshot.id,

            name:
              data.name || '',

            yearGroup:
              data.yearGroup || '',

            notes:
              data.notes || '',

            colour:
              data.colour || 'green',

            taskCount:
              0,

            upcomingCount:
              0,

            createdAt:
              data.createdAt || null

          };

        }
      );


synchroniseChildrenTaskCounts(
  getTasks()
);
  } catch (error) {

    console.error(
      'Failed to load children:',
      error
    );


    children =
      [];


    notifyChildrenUpdated();

  } finally {

    childrenAreLoading =
      false;


    refreshChildrenContent();

  }

}


/* =========================================
   REFRESH CHILDREN CONTENT
========================================= */

function refreshChildrenContent() {

  const content =
    document.querySelector(
      '#childrenContent'
    );


  const toolbar =
    document.querySelector(
      '#childrenToolbar'
    );


  if (content) {

    content.innerHTML =
      createChildrenGrid();

  }


if (toolbar) {

  toolbar.hidden =
    Boolean(activeChildProfileId)
    || childrenAreLoading
    || children.length === 0;

}


  const countElement =
    document.querySelector(
      '#visibleChildrenCount'
    );


  if (countElement) {

    countElement.textContent =
      String(children.length);

  }


  attachDynamicChildrenListeners();

}


/* =========================================
   DYNAMIC CHILDREN LISTENERS
========================================= */

function attachDynamicChildrenListeners() {

  const emptyAddChildButton =
    document.querySelector(
      '#emptyAddChildButton'
    );


  emptyAddChildButton?.addEventListener(
    'click',
    openAddChildModal
  );


document
  .querySelectorAll(
    '[data-open-child]'
  )
  .forEach((button) => {

    button.addEventListener(
      'click',
      () => {

        const childId =
          button.dataset.openChild;


        openChildProfile(
          childId
        );

      }
    );

  });


  document
    .querySelectorAll(
      '[data-child-menu-toggle]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        (event) => {

          event.stopPropagation();


          toggleChildMenu(
            button.dataset
              .childMenuToggle
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-edit-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        (event) => {

          event.stopPropagation();


          openEditChildModal(
            button.dataset.editChild
          );

        }
      );

    });


  document
    .querySelectorAll(
      '[data-delete-child]'
    )
    .forEach((button) => {

      button.addEventListener(
        'click',
        (event) => {

          event.stopPropagation();


          openDeleteChildDialog(
            button.dataset.deleteChild
          );

        }
      );

    });

}


/* =========================================
   FORM STATUS
========================================= */

function showChildFormStatus(
  message,
  type = 'info'
) {

  const form =
    document.querySelector(
      '#childForm'
    );


  if (!form) {
    return;
  }


  let status =
    document.querySelector(
      '#childFormStatus'
    );


  if (!status) {

    status =
      document.createElement(
        'div'
      );


    status.id =
      'childFormStatus';


    const actions =
      form.querySelector(
        '.child-form-actions'
      );


    if (actions) {

      form.insertBefore(
        status,
        actions
      );

    } else {

      form.appendChild(
        status
      );

    }

  }


  status.setAttribute(
    'role',
    type === 'error'
      ? 'alert'
      : 'status'
  );


  status.textContent =
    message;


  status.style.padding =
    '11px 13px';


  status.style.borderRadius =
    '11px';


  status.style.fontSize =
    '11px';


  status.style.lineHeight =
    '1.5';


  status.style.fontWeight =
    '600';


  status.style.border =
    type === 'success'
      ? '1px solid rgba(79, 138, 115, 0.18)'
      : type === 'error'
        ? '1px solid rgba(189, 92, 92, 0.18)'
        : '1px solid rgba(22, 50, 79, 0.12)';


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


/* =========================================
   ADD / EDIT FORM SUBMISSION
========================================= */

async function handleChildFormSubmit(event) {

  event.preventDefault();


  const form =
    event.currentTarget;


  const user =
    auth.currentUser;


  const nameInput =
    document.querySelector(
      '#childName'
    );


  const yearGroupInput =
    document.querySelector(
      '#childYearGroup'
    );


  const notesInput =
    document.querySelector(
      '#childNotes'
    );


  const colourInput =
    document.querySelector(
      'input[name="childColour"]:checked'
    );


  const saveButton =
    document.querySelector(
      '#saveChildButton'
    );


  const name =
    nameInput?.value.trim() || '';


  const yearGroup =
    yearGroupInput?.value.trim() || '';


  const notes =
    notesInput?.value.trim() || '';


  const colour =
    colourInput?.value || 'green';


  if (!user) {

    showChildFormStatus(
      'Your session could not be found. Please refresh the page and sign in again.',
      'error'
    );


    return;

  }


  if (name.length < 2) {

    showChildFormStatus(
      'Please enter the child’s name.',
      'error'
    );


    nameInput?.focus();


    return;

  }


  if (saveButton?.disabled) {
    return;
  }


  const originalButtonHtml =
    saveButton?.innerHTML || '';


  const isEditing =
    Boolean(editingChildId);


  try {

    if (saveButton) {

      saveButton.disabled =
        true;


      saveButton.innerHTML = `
        <span>
          ${
            isEditing
              ? 'Saving changes...'
              : 'Adding child...'
          }
        </span>
      `;

    }


    showChildFormStatus(
      isEditing
        ? 'Saving changes...'
        : 'Saving child profile...',
      'info'
    );


    if (isEditing) {

      const existingChild =
        findChildById(
          editingChildId
        );


      if (!existingChild) {

        throw new Error(
          'Child profile could not be found.'
        );

      }


      const childReference =
        doc(
          db,
          'users',
          user.uid,
          'children',
          editingChildId
        );


      await updateDoc(
        childReference,
        {

          name,

          yearGroup,

          notes,

          colour,

          updatedAt:
            serverTimestamp()

        }
      );


      const childIndex =
        children.findIndex(
          (child) =>
            child.id
            === editingChildId
        );


      if (childIndex >= 0) {

        children[childIndex] = {

          ...children[childIndex],

          name,

          yearGroup,

          notes,

          colour

        };

      }


notifyChildrenUpdated();


refreshChildrenContent();


refreshActiveChildProfile();


showChildFormStatus(
  `${name}'s profile has been updated successfully.`,
  'success'
);

    } else {

      const childrenCollection =
        collection(
          db,
          'users',
          user.uid,
          'children'
        );


      const documentReference =
        await addDoc(
          childrenCollection,
          {

            name,

            yearGroup,

            notes,

            colour,

            createdAt:
              serverTimestamp(),

            updatedAt:
              serverTimestamp()

          }
        );


      const child = {

        id:
          documentReference.id,

        name,

        yearGroup,

        notes,

        colour,

        taskCount:
          0,

        upcomingCount:
          0

      };


      children.push(
        child
      );


      notifyChildrenUpdated();


      refreshChildrenContent();


      showChildFormStatus(
        `${name} has been added successfully.`,
        'success'
      );

    }


    form.reset();


    updateColourPicker();


    updateNotesCounter();


    setTimeout(() => {

      closeChildModal();

    }, 650);

  } catch (error) {

    console.error(
      isEditing
        ? 'Failed to update child:'
        : 'Failed to add child:',
      error
    );


    let message =
      isEditing
        ? 'We could not update this child. Please try again.'
        : 'We could not add this child. Please try again.';


    if (
      error?.code
      === 'permission-denied'
    ) {

      message =
        'Firestore blocked this request. Please check that your children security rules allow updates.';

    }


    if (
      error?.code
      === 'unavailable'
    ) {

      message =
        'Firebase is temporarily unavailable. Please check your internet connection and try again.';

    }


    showChildFormStatus(
      message,
      'error'
    );

  } finally {

    if (saveButton) {

      saveButton.disabled =
        false;


      saveButton.innerHTML =
        originalButtonHtml;

    }

  }

}


/* =========================================
   DELETE CHILD
========================================= */

async function handleDeleteChild() {

  const user =
    auth.currentUser;


  const childId =
    pendingDeleteChildId;


  const child =
    findChildById(
      childId
    );


  const confirmButton =
    document.querySelector(
      '#confirmDeleteChildButton'
    );


  if (
    !user
    || !childId
    || !child
  ) {
    return;
  }


  if (confirmButton?.disabled) {
    return;
  }


  const originalButtonHtml =
    confirmButton?.innerHTML || '';


  try {

    if (confirmButton) {

      confirmButton.disabled =
        true;


      confirmButton.innerHTML = `
        <span>
          Deleting...
        </span>
      `;

    }


    const childReference =
      doc(
        db,
        'users',
        user.uid,
        'children',
        childId
      );


    await deleteDoc(
      childReference
    );


    children =
      children.filter(
        (item) =>
          item.id !== childId
      );


    notifyChildrenUpdated();


    refreshChildrenContent();


    closeDeleteChildDialog();

  } catch (error) {

    console.error(
      'Failed to delete child:',
      error
    );


    const messageElement =
      document.querySelector(
        '#childDeleteMessage'
      );


    if (messageElement) {

      messageElement.textContent =
        'We could not delete this child. Please try again.';

    }

  } finally {

    if (confirmButton) {

      confirmButton.disabled =
        false;


      confirmButton.innerHTML =
        originalButtonHtml;

    }

  }

}


/* =========================================
   ATTACH CHILDREN VIEW LISTENERS
========================================= */

export function initialiseChildrenView() {

  const addChildButton =
    document.querySelector(
      '#addChildButton'
    );


  const closeButton =
    document.querySelector(
      '#childModalCloseButton'
    );


  const cancelButton =
    document.querySelector(
      '#childFormCancelButton'
    );


  const backdrop =
    document.querySelector(
      '#childModalBackdrop'
    );


  const form =
    document.querySelector(
      '#childForm'
    );


  const searchInput =
    document.querySelector(
      '#childrenSearchInput'
    );


  const notesInput =
    document.querySelector(
      '#childNotes'
    );


  const deleteBackdrop =
    document.querySelector(
      '#childDeleteBackdrop'
    );


  const cancelDeleteButton =
    document.querySelector(
      '#cancelDeleteChildButton'
    );


  const confirmDeleteButton =
    document.querySelector(
      '#confirmDeleteChildButton'
    );
    const taskForm =
  document.querySelector(
    '#taskForm'
  );


const taskModalBackdrop =
  document.querySelector(
    '#taskModalBackdrop'
  );


const taskModalCloseButton =
  document.querySelector(
    '#taskModalCloseButton'
  );


const taskFormCancelButton =
  document.querySelector(
    '#taskFormCancelButton'
  );


const taskNotesInput =
  document.querySelector(
    '#taskNotes'
  );


const taskDeleteBackdrop =
  document.querySelector(
    '#taskDeleteBackdrop'
  );


const cancelDeleteTaskButton =
  document.querySelector(
    '#cancelDeleteTaskButton'
  );


const confirmDeleteTaskButton =
  document.querySelector(
    '#confirmDeleteTaskButton'
  );


  addChildButton?.addEventListener(
    'click',
    openAddChildModal
  );


  closeButton?.addEventListener(
    'click',
    closeChildModal
  );


  cancelButton?.addEventListener(
    'click',
    closeChildModal
  );


  backdrop?.addEventListener(
    'click',
    (event) => {

      if (
        event.target === backdrop
      ) {

        closeChildModal();

      }

    }
  );


  form?.addEventListener(
    'submit',
    handleChildFormSubmit
  );


  searchInput?.addEventListener(
    'input',
    (event) => {

      filterChildren(
        event.target.value
      );

    }
  );


  notesInput?.addEventListener(
    'input',
    updateNotesCounter
  );


  document
    .querySelectorAll(
      'input[name="childColour"]'
    )
    .forEach((input) => {

      input.addEventListener(
        'change',
        updateColourPicker
      );

    });


  cancelDeleteButton?.addEventListener(
    'click',
    closeDeleteChildDialog
  );


  confirmDeleteButton?.addEventListener(
    'click',
    handleDeleteChild
  );


  deleteBackdrop?.addEventListener(
    'click',
    (event) => {

      if (
        event.target
        === deleteBackdrop
      ) {

        closeDeleteChildDialog();

      }

    }
  );
  taskForm?.addEventListener(
  'submit',
  handleTaskFormSubmit
);


taskModalCloseButton?.addEventListener(
  'click',
  closeTaskModal
);


taskFormCancelButton?.addEventListener(
  'click',
  closeTaskModal
);


taskModalBackdrop?.addEventListener(
  'click',
  (event) => {

    if (
      event.target
      === taskModalBackdrop
    ) {

      closeTaskModal();

    }

  }
);


taskNotesInput?.addEventListener(
  'input',
  updateTaskNotesCounter
);


cancelDeleteTaskButton?.addEventListener(
  'click',
  closeDeleteTaskDialog
);


confirmDeleteTaskButton?.addEventListener(
  'click',
  handleDeleteTask
);


taskDeleteBackdrop?.addEventListener(
  'click',
  (event) => {

    if (
      event.target
      === taskDeleteBackdrop
    ) {

      closeDeleteTaskDialog();

    }

  }
);


  document.addEventListener(
    'click',
    handleDocumentClick
  );


  document.addEventListener(
    'keydown',
    handleChildrenEscapeKey
  );


  updateColourPicker();


  updateNotesCounter();


  attachDynamicChildrenListeners();


  loadChildrenFromFirestore();
  loadTasks()
  .catch((error) => {

    console.error(
      'Failed to initialise tasks:',
      error
    );

  });
  window.addEventListener(
  'familyflow:tasks-updated',
  (event) => {

    const updatedTasks =
      event.detail?.tasks || [];


    synchroniseChildrenTaskCounts(
      updatedTasks
    );


    refreshActiveChildProfile();

  }
);

}


/* =========================================
   DOCUMENT CLICK
========================================= */

function handleDocumentClick(event) {

  const clickedInsideMenu =
    event.target.closest(
      '.child-card-menu-wrapper'
    );


  if (
    openChildMenuId
    && !clickedInsideMenu
  ) {

    closeAllChildMenus();

  }

}


/* =========================================
   ESCAPE KEY
========================================= */

function handleChildrenEscapeKey(event) {

  if (
    event.key !== 'Escape'
  ) {
    return;
  }

  const taskDeleteBackdrop =
  document.querySelector(
    '#taskDeleteBackdrop'
  );


const taskModalBackdrop =
  document.querySelector(
    '#taskModalBackdrop'
  );


if (
  taskDeleteBackdrop
  && !taskDeleteBackdrop.hidden
) {

  closeDeleteTaskDialog();

  return;

}


if (
  taskModalBackdrop
  && !taskModalBackdrop.hidden
) {

  closeTaskModal();

  return;

}


  const childModalBackdrop =
    document.querySelector(
      '#childModalBackdrop'
    );


  const deleteBackdrop =
    document.querySelector(
      '#childDeleteBackdrop'
    );


  if (
    deleteBackdrop
    && !deleteBackdrop.hidden
  ) {

    closeDeleteChildDialog();


    return;

  }


  if (
    childModalBackdrop
    && !childModalBackdrop.hidden
  ) {

    closeChildModal();


    return;

  }


if (openChildMenuId) {

  closeAllChildMenus();


  return;

}


if (activeChildProfileId) {

  closeChildProfile();

}

}


/* =========================================
   SET CHILDREN DATA
========================================= */

export function setChildrenData(
  newChildren = []
) {

  children =
    Array.isArray(newChildren)
      ? [...newChildren]
      : [];


  notifyChildrenUpdated();


  refreshChildrenContent();

}


/* =========================================
   GET CHILDREN DATA
========================================= */

export function getChildrenData() {

  return [
    ...children
  ];

}