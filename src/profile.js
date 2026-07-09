import {
  auth,
  db
} from './firebase.js';

import {
  updateProfile,
  signOut
} from 'firebase/auth';

import {
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

import {
  getChildrenData
} from './children.js';

import {
  getTasks
} from './tasks.js';


/* =========================================
   FAMILYFLOW — PARENT PROFILE
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let profileUser =
  null;


let profileChildren =
  [];


let profileTasks =
  [];


let profileActionInProgress =
  false;


let profileChildrenUpdatedHandler =
  null;


let profileTasksUpdatedHandler =
  null;


let profileKeydownHandler =
  null;


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
        d="M16.5 3.5a2.1 2.1 0 0 1 3 3L8 18l-4 1 1-4Z"
      ></path>
    </svg>
  `,


  user: `
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
        r="3.5"
      ></circle>

      <path
        d="M5 21c0-4.2 3.1-7 7-7s7 2.8 7 7"
      ></path>
    </svg>
  `,


  mail: `
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
        height="14"
        rx="3"
      ></rect>

      <path d="m4 7 8 6 8-6"></path>
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


  children: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <circle
        cx="9"
        cy="8"
        r="3"
      ></circle>

      <path
        d="M3 20c0-3.5 2.7-6 6-6s6 2.5 6 6"
      ></path>

      <circle
        cx="17"
        cy="9"
        r="2.5"
      ></circle>

      <path
        d="M16 15c2.8 0 5 2 5 5"
      ></path>
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


  shield: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path
        d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"
      ></path>

      <path d="m9 12 2 2 4-4"></path>
    </svg>
  `,


  logout: `
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="1.8"
      stroke-linecap="round"
      stroke-linejoin="round"
    >
      <path d="M10 17l5-5-5-5"></path>

      <path d="M15 12H3"></path>

      <path
        d="M14 3h5a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-5"
      ></path>
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
        d="M10.3 4.3 2.8 17.2A2 2 0 0 0 4.5 20h15a2 2 0 0 0 1.7-2.8L13.7 4.3a2 2 0 0 0-3.4 0Z"
      ></path>

      <path d="M12 9v4"></path>

      <path d="M12 17h.01"></path>
    </svg>
  `

};


/* =========================================
   BASIC HELPERS
========================================= */

function escapeProfileHtml(
  value = ''
) {

  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');

}


function getProfileInitials(
  name = ''
) {

  const cleanName =
    String(name)
      .trim();


  if (!cleanName) {
    return 'P';
  }


  return cleanName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(
      (part) =>
        part
          .charAt(0)
          .toUpperCase()
    )
    .join('');

}


/* =========================================
   DATE HELPERS
========================================= */

function createProfileDateString(
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


function getProfileTomorrowDateString() {

  const tomorrow =
    new Date();


  tomorrow.setDate(
    tomorrow.getDate() + 1
  );


  return createProfileDateString(
    tomorrow
  );

}


function formatProfileMemberSince(
  user
) {

  const creationTime =
    user?.metadata?.creationTime;


  if (!creationTime) {
    return 'Not available';
  }


  const date =
    new Date(
      creationTime
    );


  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return 'Not available';
  }


  return new Intl.DateTimeFormat(
    'en-GB',
    {
      month:
        'long',

      year:
        'numeric'
    }
  ).format(date);

}


/* =========================================
   PROFILE STATISTICS
========================================= */

function getProfileStats() {

  const childrenCount =
    profileChildren.length;


  const openTasks =
    profileTasks.filter(
      (task) =>
        !task.completed
    ).length;


  const tomorrowDate =
    getProfileTomorrowDateString();


  const tomorrowOpen =
    profileTasks.filter(
      (task) =>
        !task.completed
        && task.dueDate
          === tomorrowDate
    ).length;


  return {

    childrenCount,

    openTasks,

    tomorrowOpen

  };

}


/* =========================================
   CREATE COMPLETE PROFILE PANEL
========================================= */

export function createProfilePanel() {

  return `
    <div
      class="profile-panel-backdrop"
      id="profilePanelBackdrop"
      hidden
    >

      <aside
        class="profile-panel"
        id="profilePanel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="profilePanelTitle"
      >

        <!-- =================================
             HEADER
        ================================== -->

        <header class="profile-panel-header">

          <div>

            <span class="profile-panel-eyebrow">
              Your account
            </span>


            <h2 id="profilePanelTitle">
              Parent profile
            </h2>


            <p>
              Manage your personal details and account.
            </p>

          </div>


          <button
            type="button"
            class="profile-panel-close-button"
            id="profilePanelCloseButton"
            aria-label="Close parent profile"
          >
            ${icons.close}
          </button>

        </header>


        <!-- =================================
             BODY
        ================================== -->

        <div class="profile-panel-body">


          <!-- ===============================
               PROFILE HERO
          ================================ -->

          <section class="profile-hero">

            <div
              class="profile-hero-avatar"
              id="profileHeroAvatar"
            >
              P
            </div>


            <div class="profile-hero-copy">

              <span>
                Parent account
              </span>


              <h3 id="profileHeroName">
                Parent
              </h3>


              <p id="profileHeroEmail">
                parent@example.com
              </p>

            </div>


            <button
              type="button"
              class="profile-edit-button"
              id="profileEditButton"
            >

              ${icons.edit}

              <span>
                Edit profile
              </span>

            </button>

          </section>


          <!-- ===============================
               LIVE STATISTICS
          ================================ -->

          <div class="profile-stats-grid">

            <article class="profile-stat-card">

              <span class="profile-stat-icon">
                ${icons.children}
              </span>


              <div>

                <strong
                  id="profileChildrenCount"
                >
                  0
                </strong>

                <span>
                  Children
                </span>

              </div>

            </article>


            <article class="profile-stat-card">

              <span class="profile-stat-icon">
                ${icons.task}
              </span>


              <div>

                <strong
                  id="profileOpenTasksCount"
                >
                  0
                </strong>

                <span>
                  Open tasks
                </span>

              </div>

            </article>


            <article class="profile-stat-card">

              <span class="profile-stat-icon">
                ${icons.tomorrow}
              </span>


              <div>

                <strong
                  id="profileTomorrowCount"
                >
                  0
                </strong>

                <span>
                  Tomorrow
                </span>

              </div>

            </article>

          </div>


          <!-- ===============================
               ACCOUNT DETAILS
          ================================ -->

          <section class="profile-account-card">

            <div class="profile-section-heading">

              <div>

                <span>
                  Personal details
                </span>


                <h3>
                  Your information
                </h3>

              </div>

            </div>


            <!-- NORMAL DETAILS VIEW -->

            <div
              class="profile-details-view"
              id="profileDetailsView"
            >

              <div class="profile-detail-row">

                <span class="profile-detail-icon">
                  ${icons.user}
                </span>


                <div class="profile-detail-copy">

                  <small>
                    Full name
                  </small>

                  <strong
                    id="profileDetailName"
                  >
                    Parent
                  </strong>

                </div>

              </div>


              <div class="profile-detail-row">

                <span class="profile-detail-icon">
                  ${icons.mail}
                </span>


                <div class="profile-detail-copy">

                  <small>
                    Email address
                  </small>

                  <strong
                    id="profileDetailEmail"
                  >
                    parent@example.com
                  </strong>

                </div>

              </div>


              <div class="profile-detail-row">

                <span class="profile-detail-icon">
                  ${icons.calendar}
                </span>


                <div class="profile-detail-copy">

                  <small>
                    Member since
                  </small>

                  <strong
                    id="profileMemberSince"
                  >
                    Not available
                  </strong>

                </div>

              </div>

            </div>


            <!-- EDIT FORM -->

            <form
              class="profile-edit-form"
              id="profileEditForm"
              hidden
            >

              <div class="profile-edit-form-group">

                <label for="profileNameInput">
                  Full name
                </label>


                <div class="profile-edit-input-wrapper">

                  <span>
                    ${icons.user}
                  </span>


                  <input
                    type="text"
                    id="profileNameInput"
                    maxlength="80"
                    autocomplete="name"
                    required
                  >

                </div>

              </div>


              <div class="profile-edit-form-group">

                <label for="profileEmailInput">
                  Email address
                </label>


                <div
                  class="
                    profile-edit-input-wrapper
                    is-readonly
                  "
                >

                  <span>
                    ${icons.mail}
                  </span>


                  <input
                    type="email"
                    id="profileEmailInput"
                    readonly
                    tabindex="-1"
                  >

                </div>


                <small class="profile-email-note">
                  Email changes will be handled separately with secure verification.
                </small>

              </div>


              <div
                class="profile-form-status"
                id="profileFormStatus"
                hidden
              ></div>


              <div class="profile-edit-actions">

                <button
                  type="button"
                  class="profile-secondary-button"
                  id="profileEditCancelButton"
                >
                  Cancel
                </button>


                <button
                  type="submit"
                  class="profile-primary-button"
                  id="profileSaveButton"
                >

                  <span id="profileSaveButtonText">
                    Save changes
                  </span>

                </button>

              </div>

            </form>

          </section>


          <!-- ===============================
               PRIVACY
          ================================ -->

          <section class="profile-security-card">

            <div class="profile-security-icon">
              ${icons.shield}
            </div>


            <div class="profile-security-copy">

              <span>
                Private family space
              </span>


              <h3>
                Your family's information stays with your account
              </h3>


              <p>
                Your children, tasks, plans and preparation data are linked to your private signed-in account.
              </p>

            </div>

          </section>


          <!-- ===============================
               LOGOUT
          ================================ -->

          <section class="profile-logout-card">

            <div>

              <span>
                Account session
              </span>


              <h3>
                Log out of FamilyFlow
              </h3>


              <p>
                You will need to sign in again to access your family organiser.
              </p>

            </div>


            <button
              type="button"
              class="profile-logout-button"
              id="profileLogoutButton"
            >

              ${icons.logout}

              <span>
                Log out
              </span>

            </button>

          </section>

        </div>

      </aside>

    </div>


    <!-- =====================================
         LOGOUT CONFIRMATION
    ====================================== -->

    <div
      class="profile-logout-backdrop"
      id="profileLogoutBackdrop"
      hidden
    >

      <section
        class="profile-logout-dialog"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="profileLogoutDialogTitle"
      >

        <div class="profile-logout-dialog-icon">
          ${icons.warning}
        </div>


        <div class="profile-logout-dialog-content">

          <span>
            Log out
          </span>


          <h2 id="profileLogoutDialogTitle">
            Log out of FamilyFlow?
          </h2>


          <p>
            Your family information will remain safely saved. You'll need to sign in again to access it.
          </p>

        </div>


        <div class="profile-logout-dialog-actions">

          <button
            type="button"
            class="profile-secondary-button"
            id="profileLogoutCancelButton"
          >
            Stay signed in
          </button>


          <button
            type="button"
            class="profile-confirm-logout-button"
            id="profileConfirmLogoutButton"
          >

            ${icons.logout}

            <span>
              Yes, log out
            </span>

          </button>

        </div>

      </section>

    </div>
  `;

}


/* =========================================
   PROFILE DATA HELPERS
========================================= */

function getActiveProfileUser() {

  return auth.currentUser
    || profileUser
    || null;

}


/* =========================================
   POPULATE PROFILE INFORMATION
========================================= */

function populateProfileInformation() {

  const user =
    getActiveProfileUser();


  if (!user) {
    return;
  }


  profileUser =
    user;


  const name =
    String(
      user.displayName
      || 'Parent'
    ).trim();


  const email =
    String(
      user.email
      || ''
    ).trim();


  const initials =
    getProfileInitials(
      name
    );


  const memberSince =
    formatProfileMemberSince(
      user
    );


  const textUpdates = [

    [
      '#profileHeroAvatar',
      initials
    ],

    [
      '#profileHeroName',
      name
    ],

    [
      '#profileHeroEmail',
      email
    ],

    [
      '#profileDetailName',
      name
    ],

    [
      '#profileDetailEmail',
      email
    ],

    [
      '#profileMemberSince',
      memberSince
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


  const nameInput =
    document.querySelector(
      '#profileNameInput'
    );


  const emailInput =
    document.querySelector(
      '#profileEmailInput'
    );


  if (nameInput) {

    nameInput.value =
      name;

  }


  if (emailInput) {

    emailInput.value =
      email;

  }

}


/* =========================================
   POPULATE LIVE STATISTICS
========================================= */

function populateProfileStatistics() {

  const stats =
    getProfileStats();


  const updates = [

    [
      '#profileChildrenCount',
      stats.childrenCount
    ],

    [
      '#profileOpenTasksCount',
      stats.openTasks
    ],

    [
      '#profileTomorrowCount',
      stats.tomorrowOpen
    ]

  ];


  updates.forEach(
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
          String(value);

      }

    }
  );

}


/* =========================================
   REFRESH PROFILE PANEL DATA
========================================= */

function refreshProfilePanelData() {

  populateProfileInformation();

  populateProfileStatistics();

}


/* =========================================
   FORM STATUS
========================================= */

function showProfileFormStatus(
  message,
  type = 'info'
) {

  const status =
    document.querySelector(
      '#profileFormStatus'
    );


  if (!status) {
    return;
  }


  status.hidden =
    false;


  status.textContent =
    message;


  status.dataset.type =
    type;

}


function clearProfileFormStatus() {

  const status =
    document.querySelector(
      '#profileFormStatus'
    );


  if (!status) {
    return;
  }


  status.hidden =
    true;


  status.textContent =
    '';


  delete status.dataset.type;

}


/* =========================================
   OPEN PROFILE PANEL
========================================= */

export function openProfilePanel() {

  const backdrop =
    document.querySelector(
      '#profilePanelBackdrop'
    );


  if (!backdrop) {
    return;
  }


  refreshProfilePanelData();


  closeProfileEditMode();


  backdrop.hidden =
    false;


  document.body.classList.add(
    'profile-panel-open'
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
   CLOSE PROFILE PANEL
========================================= */

export function closeProfilePanel() {

  const backdrop =
    document.querySelector(
      '#profilePanelBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'profile-panel-open'
  );


  closeProfileEditMode();


  setTimeout(
    () => {

      backdrop.hidden =
        true;

    },
    220
  );

}


/* =========================================
   OPEN EDIT MODE
========================================= */

function openProfileEditMode() {

  const user =
    getActiveProfileUser();


  if (!user) {
    return;
  }


  const detailsView =
    document.querySelector(
      '#profileDetailsView'
    );


  const editForm =
    document.querySelector(
      '#profileEditForm'
    );


  const editButton =
    document.querySelector(
      '#profileEditButton'
    );


  const nameInput =
    document.querySelector(
      '#profileNameInput'
    );


  const emailInput =
    document.querySelector(
      '#profileEmailInput'
    );


  if (
    !detailsView
    || !editForm
  ) {
    return;
  }


  clearProfileFormStatus();


  if (nameInput) {

    nameInput.value =
      String(
        user.displayName
        || 'Parent'
      ).trim();

  }


  if (emailInput) {

    emailInput.value =
      String(
        user.email
        || ''
      ).trim();

  }


  detailsView.hidden =
    true;


  editForm.hidden =
    false;


  if (editButton) {

    editButton.hidden =
      true;

  }


  setTimeout(
    () => {

      nameInput?.focus();


      nameInput?.select();

    },
    40
  );

}


/* =========================================
   CLOSE EDIT MODE
========================================= */

function closeProfileEditMode() {

  const detailsView =
    document.querySelector(
      '#profileDetailsView'
    );


  const editForm =
    document.querySelector(
      '#profileEditForm'
    );


  const editButton =
    document.querySelector(
      '#profileEditButton'
    );


  if (detailsView) {

    detailsView.hidden =
      false;

  }


  if (editForm) {

    editForm.hidden =
      true;

  }


  if (editButton) {

    editButton.hidden =
      false;

  }


  clearProfileFormStatus();

}


/* =========================================
   SAVE PROFILE CHANGES
========================================= */

async function handleProfileEditSubmit(
  event
) {

  event.preventDefault();


  const form =
    event.currentTarget;


  if (
    profileActionInProgress
  ) {
    return;
  }


  const user =
    getActiveProfileUser();


  if (!user) {

    showProfileFormStatus(
      'Your account session could not be found. Please sign in again.',
      'error'
    );


    return;

  }


  const nameInput =
    document.querySelector(
      '#profileNameInput'
    );


  const saveButton =
    document.querySelector(
      '#profileSaveButton'
    );


  const saveButtonText =
    document.querySelector(
      '#profileSaveButtonText'
    );


  const name =
    String(
      nameInput?.value || ''
    ).trim();


  /* -----------------------------------------
     VALIDATION
  ----------------------------------------- */

  if (name.length < 2) {

    showProfileFormStatus(
      'Please enter your full name.',
      'error'
    );


    nameInput?.focus();


    return;

  }


  if (name.length > 80) {

    showProfileFormStatus(
      'Your name must be 80 characters or fewer.',
      'error'
    );


    nameInput?.focus();


    return;

  }


  try {

    profileActionInProgress =
      true;


    if (saveButton) {

      saveButton.disabled =
        true;

    }


    if (saveButtonText) {

      saveButtonText.textContent =
        'Saving...';

    }


    showProfileFormStatus(
      'Saving your changes...',
      'info'
    );


    /* ---------------------------------------
       UPDATE FIREBASE AUTH PROFILE
    --------------------------------------- */

    await updateProfile(
      user,
      {
        displayName:
          name
      }
    );


    /* ---------------------------------------
       UPDATE FIRESTORE PROFILE DOCUMENT
    --------------------------------------- */

    await setDoc(
      doc(
        db,
        'users',
        user.uid
      ),
      {
        uid:
          user.uid,

        name,

        email:
          user.email || '',

        updatedAt:
          serverTimestamp()
      },
      {
        merge:
          true
      }
    );


    profileUser =
      user;


    populateProfileInformation();


    showProfileFormStatus(
      'Your profile has been updated.',
      'success'
    );


    /*
      Notify app.js so the sidebar,
      mobile avatar and dashboard greeting
      can refresh without reloading.
    */

    window.dispatchEvent(
      new CustomEvent(
        'familyflow:profile-updated',
        {
          detail: {

            uid:
              user.uid,

            name,

            email:
              user.email || '',

            initials:
              getProfileInitials(
                name
              )

          }
        }
      )
    );


    setTimeout(
      () => {

        /*
          The form reference was captured
          before the await operations.
        */

        if (
          form
          && document.body.contains(
            form
          )
        ) {

          closeProfileEditMode();

        }

      },
      450
    );

  } catch (error) {

    console.error(
      'Failed to update parent profile:',
      error
    );


    showProfileFormStatus(
      error?.message
      || 'We could not update your profile. Please try again.',
      'error'
    );

  } finally {

    profileActionInProgress =
      false;


    if (saveButton) {

      saveButton.disabled =
        false;

    }


    if (saveButtonText) {

      saveButtonText.textContent =
        'Save changes';

    }

  }

}


/* =========================================
   OPEN LOGOUT CONFIRMATION
========================================= */

function openProfileLogoutDialog() {

  const backdrop =
    document.querySelector(
      '#profileLogoutBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.hidden =
    false;


  requestAnimationFrame(
    () => {

      backdrop.classList.add(
        'is-visible'
      );

    }
  );

}


/* =========================================
   CLOSE LOGOUT CONFIRMATION
========================================= */

function closeProfileLogoutDialog() {

  const backdrop =
    document.querySelector(
      '#profileLogoutBackdrop'
    );


  if (!backdrop) {
    return;
  }


  backdrop.classList.remove(
    'is-visible'
  );


  setTimeout(
    () => {

      backdrop.hidden =
        true;

    },
    200
  );

}


/* =========================================
   LOG OUT
========================================= */

async function handleProfileLogout() {

  if (
    profileActionInProgress
  ) {
    return;
  }


  const confirmButton =
    document.querySelector(
      '#profileConfirmLogoutButton'
    );


  try {

    profileActionInProgress =
      true;


    if (confirmButton) {

      confirmButton.disabled =
        true;


      confirmButton.innerHTML = `
        <span>
          Logging out...
        </span>
      `;

    }


    await signOut(
      auth
    );


    /*
      main.js already watches Firebase Auth.

      Once signOut succeeds, the auth observer
      should take the user back to the logged-out
      experience automatically.
    */

  } catch (error) {

    console.error(
      'Failed to log out:',
      error
    );


    profileActionInProgress =
      false;


    if (confirmButton) {

      confirmButton.disabled =
        false;


      confirmButton.innerHTML = `
        ${icons.logout}

        <span>
          Yes, log out
        </span>
      `;

    }

  }

}


/* =========================================
   ESCAPE KEY BEHAVIOUR
========================================= */

function handleProfileKeydown(
  event
) {

  if (
    event.key !== 'Escape'
  ) {
    return;
  }


  const logoutBackdrop =
    document.querySelector(
      '#profileLogoutBackdrop'
    );


  if (
    logoutBackdrop
    && !logoutBackdrop.hidden
  ) {

    closeProfileLogoutDialog();

    return;

  }


  const editForm =
    document.querySelector(
      '#profileEditForm'
    );


  if (
    editForm
    && !editForm.hidden
  ) {

    closeProfileEditMode();

    return;

  }


  const profileBackdrop =
    document.querySelector(
      '#profilePanelBackdrop'
    );


  if (
    profileBackdrop
    && !profileBackdrop.hidden
  ) {

    closeProfilePanel();

  }

}


/* =========================================
   ATTACH PROFILE LISTENERS
========================================= */

function attachProfileListeners() {

  const panelBackdrop =
    document.querySelector(
      '#profilePanelBackdrop'
    );


  const logoutBackdrop =
    document.querySelector(
      '#profileLogoutBackdrop'
    );


  document
    .querySelector(
      '#profilePanelCloseButton'
    )
    ?.addEventListener(
      'click',
      closeProfilePanel
    );


  document
    .querySelector(
      '#profileEditButton'
    )
    ?.addEventListener(
      'click',
      openProfileEditMode
    );


  document
    .querySelector(
      '#profileEditCancelButton'
    )
    ?.addEventListener(
      'click',
      closeProfileEditMode
    );


  document
    .querySelector(
      '#profileEditForm'
    )
    ?.addEventListener(
      'submit',
      handleProfileEditSubmit
    );


  document
    .querySelector(
      '#profileLogoutButton'
    )
    ?.addEventListener(
      'click',
      openProfileLogoutDialog
    );


  document
    .querySelector(
      '#profileLogoutCancelButton'
    )
    ?.addEventListener(
      'click',
      closeProfileLogoutDialog
    );


  document
    .querySelector(
      '#profileConfirmLogoutButton'
    )
    ?.addEventListener(
      'click',
      handleProfileLogout
    );


  panelBackdrop?.addEventListener(
    'click',
    (event) => {

      if (
        event.target
        === panelBackdrop
      ) {

        closeProfilePanel();

      }

    }
  );


  logoutBackdrop?.addEventListener(
    'click',
    (event) => {

      if (
        event.target
        === logoutBackdrop
      ) {

        closeProfileLogoutDialog();

      }

    }
  );

}


/* =========================================
   INITIALISE PARENT PROFILE
========================================= */

export function initialiseProfilePanel({
  user = null
} = {}) {

  profileUser =
    user
    || auth.currentUser
    || null;


  profileChildren =
    getChildrenData();


  profileTasks =
    getTasks();


  refreshProfilePanelData();


  attachProfileListeners();


  /* -----------------------------------------
     REMOVE OLD GLOBAL LISTENERS
  ----------------------------------------- */

  if (
    profileChildrenUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:children-updated',
      profileChildrenUpdatedHandler
    );

  }


  if (
    profileTasksUpdatedHandler
  ) {

    window.removeEventListener(
      'familyflow:tasks-updated',
      profileTasksUpdatedHandler
    );

  }


  if (
    profileKeydownHandler
  ) {

    document.removeEventListener(
      'keydown',
      profileKeydownHandler
    );

  }


  /* -----------------------------------------
     CREATE FRESH HANDLERS
  ----------------------------------------- */

  profileChildrenUpdatedHandler =
    (event) => {

      profileChildren =
        Array.isArray(
          event.detail?.children
        )
          ? event.detail.children.map(
              (child) => ({
                ...child
              })
            )
          : [];


      populateProfileStatistics();

    };


  profileTasksUpdatedHandler =
    (event) => {

      profileTasks =
        Array.isArray(
          event.detail?.tasks
        )
          ? event.detail.tasks.map(
              (task) => ({
                ...task
              })
            )
          : [];


      populateProfileStatistics();

    };


  profileKeydownHandler =
    handleProfileKeydown;


  /* -----------------------------------------
     ATTACH GLOBAL LISTENERS
  ----------------------------------------- */

  window.addEventListener(
    'familyflow:children-updated',
    profileChildrenUpdatedHandler
  );


  window.addEventListener(
    'familyflow:tasks-updated',
    profileTasksUpdatedHandler
  );


  document.addEventListener(
    'keydown',
    profileKeydownHandler
  );

}


/* =========================================
   PUBLIC REFRESH
========================================= */

export function refreshProfilePanel() {

  profileUser =
    auth.currentUser
    || profileUser;


  profileChildren =
    getChildrenData();


  profileTasks =
    getTasks();


  refreshProfilePanelData();

}