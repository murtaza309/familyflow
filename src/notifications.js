import { auth } from './firebase.js';
import './notifications.css';

import {
  getTasks
} from './tasks.js';

import {
  getChildrenData
} from './children.js';


/* =========================================
   FAMILYFLOW — NOTIFICATION CENTRE
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let notificationItems = [];

let notificationCentreOpen = false;

let notificationTasksUpdatedHandler = null;

let notificationChildrenUpdatedHandler = null;

let notificationCallbacks = {

  onOpenChild:
    null,

  onOpenPlanner:
    null,

  onOpenToday:
    null,

  onOpenTomorrow:
    null

};


/* =========================================
   ICONS
========================================= */

const icons = {

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


  bell: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
      <path d="M10 21h4"></path>
    </svg>
  `,


  overdue: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.9"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle cx="12" cy="12" r="9"></circle>
      <path d="M12 7v6"></path>
      <path d="M12 17h.01"></path>
    </svg>
  `,


  today: `
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
      <path d="m8 15 2 2 5-5"></path>
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
      <path d="M6 3h12a2 2 0 0 1 2 2v16H4V5a2 2 0 0 1 2-2Z"></path>
      <path d="M8 8h8"></path>
      <path d="M8 12h5"></path>
      <path d="m8 16 2 2 5-5"></path>
    </svg>
  `,


  appointment: `
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
      <circle cx="12" cy="15" r="2"></circle>
    </svg>
  `,


  check: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
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
      <path d="M18 8a6 6 0 1 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"></path>
      <path d="M10 21h4"></path>
    </svg>
  `

};


/* =========================================
   BASIC HELPERS
========================================= */

function escapeNotificationHtml(
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
   DATE STRING
========================================= */

function createNotificationDateString(
  date
) {

  const year =
    date.getFullYear();


  const month =
    String(
      date.getMonth() + 1
    ).padStart(
      2,
      '0'
    );


  const day =
    String(
      date.getDate()
    ).padStart(
      2,
      '0'
    );


  return `${year}-${month}-${day}`;

}


/* =========================================
   TODAY
========================================= */

function getNotificationTodayDate() {

  return createNotificationDateString(
    new Date()
  );

}


/* =========================================
   TOMORROW
========================================= */

function getNotificationTomorrowDate() {

  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  return createNotificationDateString(
    tomorrow
  );

}


/* =========================================
   DATE AFTER NUMBER OF DAYS
========================================= */

function getNotificationFutureDate(
  numberOfDays
) {

  const date =
    new Date();


  date.setDate(
    date.getDate()
    + numberOfDays
  );


  return createNotificationDateString(
    date
  );

}


/* =========================================
   FORMAT DATE
========================================= */

function formatNotificationDate(
  dateValue = ''
) {

  if (!dateValue) {
    return '';
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


  const date =
    new Date(
      year,
      month - 1,
      day
    );


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
   FORMAT TIME
========================================= */

function formatNotificationTime(
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
   CHILD LOOKUP
========================================= */

function getNotificationChildById(
  childId = ''
) {

  return getChildrenData().find(
    (child) =>
      child.id === childId
  ) || null;

}


/* =========================================
   STORAGE KEY
========================================= */

function getNotificationReadStorageKey() {

  const userId =
    auth.currentUser?.uid
    || 'anonymous';


  return `familyflow-notifications-read-${userId}`;

}


/* =========================================
   READ IDS
========================================= */

function getReadNotificationIds() {

  try {

    const storedValue =
      window.localStorage.getItem(
        getNotificationReadStorageKey()
      );


    if (!storedValue) {
      return new Set();
    }


    const parsedValue =
      JSON.parse(
        storedValue
      );


    if (
      !Array.isArray(
        parsedValue
      )
    ) {
      return new Set();
    }


    return new Set(
      parsedValue
    );

  } catch (error) {

    console.warn(
      'Could not read notification state:',
      error
    );


    return new Set();

  }

}


/* =========================================
   SAVE READ IDS
========================================= */

function saveReadNotificationIds(
  readIds
) {

  try {

    window.localStorage.setItem(
      getNotificationReadStorageKey(),
      JSON.stringify(
        Array.from(
          readIds
        )
      )
    );

  } catch (error) {

    console.warn(
      'Could not save notification state:',
      error
    );

  }

}


/* =========================================
   BUILD NOTIFICATION ID
========================================= */

function createNotificationId({
  type,
  taskId,
  dueDate
}) {

  return [
    type,
    taskId,
    dueDate || 'no-date'
  ].join(':');

}


/* =========================================
   BUILD NOTIFICATION MESSAGE
========================================= */

function createNotificationMessage({
  task,
  child,
  type
}) {

  const childName =
    child?.name
    || 'your child';


  const taskTitle =
    task?.title
    || 'Task';


  const time =
    formatNotificationTime(
      task?.dueTime || ''
    );


  if (
    type === 'overdue'
  ) {

    return `${taskTitle} for ${childName} is overdue.`;

  }


  if (
    type === 'today'
  ) {

    return time
      ? `${taskTitle} for ${childName} is due today at ${time}.`
      : `${taskTitle} for ${childName} is due today.`;

  }


  if (
    type === 'tomorrow'
  ) {

    return time
      ? `${taskTitle} for ${childName} is due tomorrow at ${time}.`
      : `${taskTitle} for ${childName} is due tomorrow.`;

  }


  if (
    type === 'appointment'
  ) {

    const date =
      formatNotificationDate(
        task?.dueDate || ''
      );


    return time
      ? `${taskTitle} for ${childName} is on ${date} at ${time}.`
      : `${taskTitle} for ${childName} is on ${date}.`;

  }


  return `${taskTitle} for ${childName}.`;

}


/* =========================================
   BUILD NOTIFICATION ITEMS
========================================= */

function buildNotificationItems() {

  const tasks =
    getTasks();


  const today =
    getNotificationTodayDate();


  const tomorrow =
    getNotificationTomorrowDate();


  const appointmentLimit =
    getNotificationFutureDate(
      7
    );


  const items =
    [];


  tasks.forEach(
    (task) => {

      /*
        Completed tasks no longer need
        notification attention.
      */

      if (
        task.completed
      ) {
        return;
      }


      const dueDate =
        task.dueDate || '';


      if (!dueDate) {
        return;
      }


      const child =
        getNotificationChildById(
          task.childId
        );


      let type =
        null;


      let title =
        'FamilyFlow notification';


      let priority =
        99;


      let actionView =
        'planner';


      /*
        Priority order prevents duplicate
        notifications for the same task.
      */

      if (
        dueDate < today
      ) {

        type =
          'overdue';


        title =
          'Overdue task';


        priority =
          1;


        actionView =
          'today';

      } else if (
        dueDate === today
      ) {

        type =
          'today';


        title =
          'Due today';


        priority =
          2;


        actionView =
          'today';

      } else if (
        dueDate === tomorrow
      ) {

        type =
          'tomorrow';


        title =
          'Prepare for tomorrow';


        priority =
          3;


        actionView =
          'tomorrow';

      } else if (
        task.category === 'appointment'
        && dueDate > tomorrow
        && dueDate <= appointmentLimit
      ) {

        type =
          'appointment';


        title =
          'Upcoming appointment';


        priority =
          4;


        actionView =
          'planner';

      }


      if (!type) {
        return;
      }


      items.push({

        id:
          createNotificationId({
            type,
            taskId:
              task.id,
            dueDate
          }),

        type,

        title,

        message:
          createNotificationMessage({
            task,
            child,
            type
          }),

        priority,

        taskId:
          task.id,

        childId:
          task.childId || '',

        childName:
          child?.name || 'Child',

        dueDate,

        dueTime:
          task.dueTime || '',

        actionView

      });

    }
  );


  return items.sort(
    (
      itemA,
      itemB
    ) => {

      if (
        itemA.priority
        !== itemB.priority
      ) {

        return itemA.priority
        - itemB.priority;

      }


      if (
        itemA.dueDate
        !== itemB.dueDate
      ) {

        return itemA.dueDate.localeCompare(
          itemB.dueDate
        );

      }


      const timeA =
        itemA.dueTime || '23:59';


      const timeB =
        itemB.dueTime || '23:59';


      return timeA.localeCompare(
        timeB
      );

    }
  );

}


/* =========================================
   GET ICON FOR TYPE
========================================= */

function getNotificationTypeIcon(
  type
) {

  switch (type) {

    case 'overdue':

      return icons.overdue;


    case 'today':

      return icons.today;


    case 'tomorrow':

      return icons.tomorrow;


    case 'appointment':

      return icons.appointment;


    default:

      return icons.bell;

  }

}


/* =========================================
   GET TYPE LABEL
========================================= */

function getNotificationTypeLabel(
  type
) {

  switch (type) {

    case 'overdue':

      return 'Overdue';


    case 'today':

      return 'Today';


    case 'tomorrow':

      return 'Tomorrow';


    case 'appointment':

      return 'Appointment';


    default:

      return 'Notification';

  }

}


/* =========================================
   GET CURRENT ITEMS
========================================= */

export function getNotificationItems() {

  const readIds =
    getReadNotificationIds();


  notificationItems =
    buildNotificationItems()
      .map(
        (item) => ({

          ...item,

          read:
            readIds.has(
              item.id
            )

        })
      );


  return notificationItems.map(
    (item) => ({
      ...item
    })
  );

}


/* =========================================
   GET UNREAD COUNT
========================================= */

export function getUnreadNotificationCount() {

  return getNotificationItems()
    .filter(
      (item) =>
        !item.read
    )
    .length;

}


/* =========================================
   MARK ONE AS READ
========================================= */

export function markNotificationAsRead(
  notificationId
) {

  if (!notificationId) {
    return;
  }


  const readIds =
    getReadNotificationIds();


  readIds.add(
    notificationId
  );


  saveReadNotificationIds(
    readIds
  );


  refreshNotificationCentre();

}


/* =========================================
   MARK ALL AS READ
========================================= */

export function markAllNotificationsAsRead() {

  const readIds =
    getReadNotificationIds();


  getNotificationItems()
    .forEach(
      (item) => {

        readIds.add(
          item.id
        );

      }
    );


  saveReadNotificationIds(
    readIds
  );


  refreshNotificationCentre();

}


/* =========================================
   BROWSER PERMISSION STATUS
========================================= */

export function getBrowserNotificationPermission() {

  if (
    !(
      'Notification'
      in window
    )
  ) {

    return 'unsupported';

  }


  return Notification.permission;

}


/* =========================================
   REQUEST BROWSER PERMISSION
========================================= */

export async function requestBrowserNotificationPermission() {

  if (
    !(
      'Notification'
      in window
    )
  ) {

    return {

      supported:
        false,

      permission:
        'unsupported'

    };

  }


  try {

    const permission =
      await Notification
        .requestPermission();


    refreshNotificationCentre();


    if (
      permission === 'granted'
    ) {

      await showBrowserNotification(
        'FamilyFlow notifications enabled',
        {
          body:
            'You can now receive important reminders about overdue tasks, today, tomorrow and upcoming appointments.',

          tag:
            'familyflow-notifications-enabled'
        }
      );

    }


    return {

      supported:
        true,

      permission

    };

  } catch (error) {

    console.error(
      'Could not request notification permission:',
      error
    );


    return {

      supported:
        true,

      permission:
        'error'

    };

  }

}


/* =========================================
   SHOW BROWSER NOTIFICATION
========================================= */

export async function showBrowserNotification(
  title,
  {
    body = '',
    tag = '',
    data = {}
  } = {}
) {

  if (
    !(
      'Notification'
      in window
    )
    || Notification.permission
      !== 'granted'
  ) {

    return false;

  }


  const options = {

    body,

    tag:
      tag || undefined,

    data,

    icon:
      '/familyflow-icon.png',

    badge:
      '/familyflow-icon.png'

  };


  /*
    Prefer an existing service worker.

    This is the correct path for mobile
    browsers and will be fully enabled in
    our next service-worker step.
  */

  if (
    'serviceWorker'
    in navigator
  ) {

    try {

      const registration =
        await navigator
          .serviceWorker
          .getRegistration();


      if (registration) {

        await registration
          .showNotification(
            title,
            options
          );


        return true;

      }

    } catch (error) {

      console.warn(
        'Service worker notification failed:',
        error
      );

    }

  }


  /*
    Desktop fallback.
  */

  try {

    const notification =
      new Notification(
        title,
        options
      );


    notification.onclick =
      () => {

        window.focus();

        notification.close();

      };


    return true;

  } catch (error) {

    console.warn(
      'Browser notification could not be displayed:',
      error
    );


    return false;

  }

}


/* =========================================
   NOTIFICATION CARD
========================================= */

function createNotificationCard(
  item
) {

  const id =
    escapeNotificationHtml(
      item.id
    );


  const type =
    escapeNotificationHtml(
      item.type
    );


  const title =
    escapeNotificationHtml(
      item.title
    );


  const message =
    escapeNotificationHtml(
      item.message
    );


  return `
    <article
      class="
        notification-card
        notification-card-${type}
        ${item.read ? 'is-read' : 'is-unread'}
      "
      data-notification-id="${id}"
    >

      <div
        class="
          notification-card-icon
          notification-card-icon-${type}
        "
      >
        ${getNotificationTypeIcon(
          item.type
        )}
      </div>


      <div class="notification-card-main">

        <div class="notification-card-top">

          <span
            class="
              notification-type-label
              notification-type-label-${type}
            "
          >
            ${escapeNotificationHtml(
              getNotificationTypeLabel(
                item.type
              )
            )}
          </span>


          ${
            !item.read
              ? `
                <span
                  class="notification-unread-dot"
                  aria-label="Unread"
                ></span>
              `
              : ''
          }

        </div>


        <h3>
          ${title}
        </h3>


        <p>
          ${message}
        </p>


        <button
          type="button"
          class="notification-open-action"
          data-open-notification="${id}"
        >
          <span>
            View details
          </span>

          ${icons.arrow}
        </button>

      </div>

    </article>
  `;

}


/* =========================================
   EMPTY STATE
========================================= */

function createNotificationEmptyState() {

  return `
    <div class="notification-empty-state">

      <div class="notification-empty-icon">
        ${icons.empty}
      </div>


      <span>
        All caught up
      </span>


      <h3>
        Nothing needs your attention
      </h3>


      <p>
        Important reminders about overdue tasks,
        today, tomorrow and upcoming appointments
        will appear here.
      </p>

    </div>
  `;

}


/* =========================================
   BROWSER PERMISSION SECTION
========================================= */

function createBrowserPermissionSection() {

  const permission =
    getBrowserNotificationPermission();


  if (
    permission === 'granted'
  ) {

    return `
      <div
        class="
          notification-permission-card
          is-enabled
        "
      >

        <div class="notification-permission-icon">
          ${icons.check}
        </div>


        <div>

          <strong>
            Browser notifications enabled
          </strong>

          <span>
            Important FamilyFlow reminders can appear as system notifications.
          </span>

        </div>

      </div>
    `;

  }


  if (
    permission === 'denied'
  ) {

    return `
      <div
        class="
          notification-permission-card
          is-blocked
        "
      >

        <div class="notification-permission-icon">
          ${icons.bell}
        </div>


        <div>

          <strong>
            Browser notifications blocked
          </strong>

          <span>
            You can enable them later from your browser or device settings.
          </span>

        </div>

      </div>
    `;

  }


  if (
    permission === 'unsupported'
  ) {

    return `
      <div
        class="
          notification-permission-card
          is-unsupported
        "
      >

        <div class="notification-permission-icon">
          ${icons.bell}
        </div>


        <div>

          <strong>
            System notifications unavailable
          </strong>

          <span>
            Your in-app FamilyFlow notification centre will still work normally.
          </span>

        </div>

      </div>
    `;

  }


  return `
    <div class="notification-permission-card">

      <div class="notification-permission-icon">
        ${icons.bell}
      </div>


      <div class="notification-permission-copy">

        <strong>
          Get important reminders
        </strong>

        <span>
          Enable browser notifications for overdue tasks,
          today, tomorrow and upcoming appointments.
        </span>

      </div>


      <button
        type="button"
        class="notification-enable-button"
        id="enableBrowserNotificationsButton"
      >
        Enable notifications
      </button>

    </div>
  `;

}


/* =========================================
   CREATE COMPLETE PANEL
========================================= */

export function createNotificationPanel() {

  const items =
    getNotificationItems();


  const unreadCount =
    items.filter(
      (item) =>
        !item.read
    ).length;


  return `
    <div
      class="notification-panel-backdrop"
      id="notificationPanelBackdrop"
      hidden
    >

      <aside
        class="notification-panel"
        id="notificationPanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="notificationPanelTitle"
      >

        <div class="notification-panel-header">

          <div>

            <span class="notification-panel-eyebrow">
              FamilyFlow
            </span>


            <h2 id="notificationPanelTitle">
              Notifications
            </h2>


            <p>
              ${
                unreadCount === 0
                  ? 'You are all caught up.'
                  : unreadCount === 1
                    ? '1 unread notification.'
                    : `${unreadCount} unread notifications.`
              }
            </p>

          </div>


          <button
            type="button"
            class="notification-panel-close"
            id="notificationPanelCloseButton"
            aria-label="Close notifications"
          >
            ${icons.close}
          </button>

        </div>


        <div
          class="notification-permission-container"
          id="notificationPermissionContainer"
        >
          ${createBrowserPermissionSection()}
        </div>


        ${
          items.length
            ? `
              <div class="notification-list-toolbar">

                <span>
                  Important updates
                </span>


                ${
                  unreadCount > 0
                    ? `
                      <button
                        type="button"
                        id="markAllNotificationsReadButton"
                      >
                        Mark all as read
                      </button>
                    `
                    : ''
                }

              </div>


              <div
                class="notification-list"
                id="notificationList"
              >

                ${items
                  .map(
                    (item) =>
                      createNotificationCard(
                        item
                      )
                  )
                  .join('')}

              </div>
            `
            : createNotificationEmptyState()
        }

      </aside>

    </div>
  `;

}


/* =========================================
   UPDATE BELL BADGE
========================================= */

function updateNotificationBellBadge() {

  const button =
    document.querySelector(
      '#notificationButton'
    );


  if (!button) {
    return;
  }


  let badge =
    button.querySelector(
      '.notification-bell-badge'
    );


  const unreadCount =
    getUnreadNotificationCount();


  if (
    unreadCount === 0
  ) {

    badge?.remove();


    button.classList.remove(
      'has-notifications'
    );


    return;

  }


  if (!badge) {

    badge =
      document.createElement(
        'span'
      );


    badge.className =
      'notification-bell-badge';


    button.appendChild(
      badge
    );

  }


  badge.textContent =
    unreadCount > 9
      ? '9+'
      : String(
          unreadCount
        );


  button.classList.add(
    'has-notifications'
  );

}


/* =========================================
   REFRESH PANEL
========================================= */

export function refreshNotificationCentre() {

  getNotificationItems();


  updateNotificationBellBadge();


  const existingPanel =
    document.querySelector(
      '#notificationPanelBackdrop'
    );


  if (
    !existingPanel
  ) {
    return;
  }


  const wasOpen =
    notificationCentreOpen;


  const wrapper =
    document.createElement(
      'div'
    );


  wrapper.innerHTML =
    createNotificationPanel();


  const newPanel =
    wrapper.firstElementChild;


  existingPanel.replaceWith(
    newPanel
  );


  if (wasOpen) {

    newPanel.hidden =
      false;


    newPanel.classList.add(
      'is-visible'
    );

  }


  attachNotificationPanelListeners();

}


/* =========================================
   OPEN PANEL
========================================= */

export function openNotificationCentre() {

  const backdrop =
    document.querySelector(
      '#notificationPanelBackdrop'
    );


  if (!backdrop) {
    return;
  }


  notificationCentreOpen =
    true;


  backdrop.hidden =
    false;


  document.body.classList.add(
    'notification-panel-open'
  );


  requestAnimationFrame(
    () => {

      backdrop.classList.add(
        'is-visible'
      );

    }
  );

}


/* =========================================
   CLOSE PANEL
========================================= */

export function closeNotificationCentre() {

  const backdrop =
    document.querySelector(
      '#notificationPanelBackdrop'
    );


  if (!backdrop) {
    return;
  }


  notificationCentreOpen =
    false;


  backdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'notification-panel-open'
  );


  setTimeout(
    () => {

      backdrop.hidden =
        true;

    },
    220
  );

}


/* =========================================
   OPEN NOTIFICATION ACTION
========================================= */

function handleOpenNotification(
  notificationId
) {

  const item =
    getNotificationItems()
      .find(
        (notification) =>
          notification.id
          === notificationId
      );


  if (!item) {
    return;
  }


  markNotificationAsRead(
    item.id
  );


  closeNotificationCentre();


  switch (
    item.actionView
  ) {

    case 'today':

      notificationCallbacks
        .onOpenToday?.();

      break;


    case 'tomorrow':

      notificationCallbacks
        .onOpenTomorrow?.();

      break;


    case 'planner':

      notificationCallbacks
        .onOpenPlanner?.(
          item.dueDate
        );

      break;


    default:

      break;

  }

}


/* =========================================
   PANEL LISTENERS
========================================= */

function attachNotificationPanelListeners() {

  document
    .querySelector(
      '#notificationPanelCloseButton'
    )
    ?.addEventListener(
      'click',
      closeNotificationCentre
    );


  document
    .querySelector(
      '#notificationPanelBackdrop'
    )
    ?.addEventListener(
      'click',
      (event) => {

        if (
          event.target.id
          === 'notificationPanelBackdrop'
        ) {

          closeNotificationCentre();

        }

      }
    );


  document
    .querySelector(
      '#enableBrowserNotificationsButton'
    )
    ?.addEventListener(
      'click',
      async () => {

        const button =
          document.querySelector(
            '#enableBrowserNotificationsButton'
          );


        if (button) {

          button.disabled =
            true;


          button.textContent =
            'Requesting permission...';

        }


        await requestBrowserNotificationPermission();


        refreshNotificationCentre();

      }
    );


  document
    .querySelector(
      '#markAllNotificationsReadButton'
    )
    ?.addEventListener(
      'click',
      markAllNotificationsAsRead
    );


  document
    .querySelectorAll(
      '[data-open-notification]'
    )
    .forEach(
      (button) => {

        button.addEventListener(
          'click',
          () => {

            handleOpenNotification(
              button.dataset
                .openNotification
            );

          }
        );

      }
    );

}


/* =========================================
   INITIALISE
========================================= */

export function initialiseNotificationCentre({

  onOpenChild = null,

  onOpenPlanner = null,

  onOpenToday = null,

  onOpenTomorrow = null

} = {}) {

  notificationCallbacks = {

    onOpenChild:
      typeof onOpenChild
      === 'function'
        ? onOpenChild
        : null,

    onOpenPlanner:
      typeof onOpenPlanner
      === 'function'
        ? onOpenPlanner
        : null,

    onOpenToday:
      typeof onOpenToday
      === 'function'
        ? onOpenToday
        : null,

    onOpenTomorrow:
      typeof onOpenTomorrow
      === 'function'
        ? onOpenTomorrow
        : null

  };


  getNotificationItems();


  updateNotificationBellBadge();


  attachNotificationPanelListeners();


  document
    .querySelector(
      '#notificationButton'
    )
    ?.addEventListener(
      'click',
      openNotificationCentre
    );


  /*
    Avoid duplicate global listeners.
  */

  if (
    notificationTasksUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:tasks-updated',
      notificationTasksUpdatedHandler
    );

  }


  if (
    notificationChildrenUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:children-updated',
      notificationChildrenUpdatedHandler
    );

  }


  notificationTasksUpdatedHandler =
    () => {

      refreshNotificationCentre();

    };


  notificationChildrenUpdatedHandler =
    () => {

      refreshNotificationCentre();

    };


  window.addEventListener(
    'familyflow:tasks-updated',
    notificationTasksUpdatedHandler
  );


  window.addEventListener(
    'familyflow:children-updated',
    notificationChildrenUpdatedHandler
  );


  document.addEventListener(
    'keydown',
    (event) => {

      if (
        event.key === 'Escape'
        && notificationCentreOpen
      ) {

        closeNotificationCentre();

      }

    }
  );

}