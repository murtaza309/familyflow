import './style.css';
import familyFlowLogo from './assets/familyflow-logo.png';

import { auth, db } from './firebase.js';
import { renderFamilyFlowApp } from './app.js';

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  deleteUser,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  onAuthStateChanged
} from 'firebase/auth';

import {
  doc,
  setDoc,
  serverTimestamp
} from 'firebase/firestore';

const app = document.querySelector('#app');
app.style.visibility = 'hidden';

app.innerHTML = `
  <main class="auth-page">

    <!-- =====================================
         DESKTOP BRAND PANEL
    ====================================== -->

    <section class="auth-brand-panel">

      <div class="brand-panel-overlay"></div>

      <div class="brand-panel-content">

        <a href="#" class="brand">

<div class="auth-brand-logo">
  <img
    src="${familyFlowLogo}"
    alt="FamilyFlow"
  >
</div>

        </a>


        <div class="hero-content">

          <span class="eyebrow">
            Your family, beautifully organised
          </span>

          <h1>
            Less chaos.
            <br>
            More time for
            <span>what matters.</span>
          </h1>

          <p>
            Keep every child's tasks, routines, activities and tomorrow's
            preparations together in one calm, beautifully organised place.
          </p>


          <div class="feature-list">

            <div class="feature-item">

              <div class="feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  See everything happening today
                </strong>

                <span>
                  One clear view for the whole family.
                </span>
              </div>

            </div>


            <div class="feature-item">

              <div class="feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Plan each child's week
                </strong>

                <span>
                  School, appointments, activities and tasks.
                </span>
              </div>

            </div>


            <div class="feature-item">

              <div class="feature-icon">
                ✓
              </div>

              <div>
                <strong>
                  Prepare for tomorrow
                </strong>

                <span>
                  Know exactly what needs packing and preparing.
                </span>
              </div>

            </div>

          </div>

        </div>


        <div class="brand-footer">

          <span>Simple</span>

          <i></i>

          <span>Private</span>

          <i></i>

          <span>Built for families</span>

        </div>

      </div>

    </section>


    <!-- =====================================
         AUTH PANEL
    ====================================== -->

    <section class="auth-form-panel">


      <!-- MOBILE TOP BAR -->

      <div class="mobile-topbar">

        <div class="mobile-brand">

 <div class="auth-brand-logo">
  <img
    src="${familyFlowLogo}"
    alt="FamilyFlow"
  >
</div>

        </div>


        <div class="mobile-security-pill">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>

          <span>Private</span>

        </div>

      </div>


      <!-- MOBILE HERO -->

      <div class="mobile-hero">

        <span class="mobile-eyebrow">
          Your family, one clear plan
        </span>

        <h1>
          Stay on top of
          <span>every child's day.</span>
        </h1>

        <p>
          Tasks, routines, activities and tomorrow's preparation,
          all together in one calm family space.
        </p>


        <div class="mobile-feature-pills">

          <span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <rect x="4" y="5" width="16" height="15" rx="2"></rect>
              <path d="M8 3v4M16 3v4M4 10h16"></path>
            </svg>

            Today

          </span>


          <span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M5 5h14v14H5z"></path>
              <path d="m8 12 2.5 2.5L16 9"></path>
            </svg>

            Routines

          </span>


          <span>

            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="1.8"
            >
              <path d="M5 4h14v16H5z"></path>
              <path d="M8 8h8M8 12h5"></path>
            </svg>

            Tomorrow

          </span>

        </div>

      </div>


      <!-- =====================================
           AUTH CONTAINER
      ====================================== -->

      <div class="auth-container">


        <!-- =====================================
             LOGIN VIEW
        ====================================== -->

        <div
          id="loginView"
          class="auth-view"
        >

          <div class="auth-heading">

            <span class="welcome-label">
              Welcome back
            </span>

            <h2>
              Sign in to your family space
            </h2>

            <p>
              Pick up where you left off and see what needs your attention today.
            </p>

          </div>


          <form
            id="loginForm"
            class="auth-form"
          >


            <!-- EMAIL -->

            <div class="form-group">

              <label for="loginEmail">
                Email address
              </label>

              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="M4 6h16v12H4z"></path>
                    <path d="m4 7 8 6 8-6"></path>
                  </svg>

                </span>


                <input
                  type="email"
                  id="loginEmail"
                  name="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  required
                >

              </div>

            </div>


            <!-- PASSWORD -->

            <div class="form-group">

              <div class="label-row">

                <label for="loginPassword">
                  Password
                </label>

                <button
                  type="button"
                  class="text-button forgot-password-button"
                  id="forgotPasswordButton"
                >
                  Forgot password?
                </button>

              </div>


              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    ></rect>

                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>

                  </svg>

                </span>


                <input
                  type="password"
                  id="loginPassword"
                  name="password"
                  placeholder="Enter your password"
                  autocomplete="current-password"
                  required
                >


                <button
                  type="button"
                  class="password-toggle"
                  id="loginPasswordToggle"
                  aria-label="Show password"
                >

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>

                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                    ></circle>

                  </svg>

                </button>

              </div>

            </div>


            <!-- REMEMBER ME -->

            <label class="remember-row">

              <input
                type="checkbox"
                id="rememberMe"
              >

              <span class="custom-checkbox">

                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="3"
                >
                  <path d="m5 12 4 4L19 7"></path>
                </svg>

              </span>

              <span>
                Keep me signed in
              </span>

            </label>


            <!-- LOGIN BUTTON -->

            <button
              type="submit"
              class="primary-button"
              id="loginButton"
            >

              <span>
                Sign in
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14"></path>
                <path d="m14 7 5 5-5 5"></path>
              </svg>

            </button>

          </form>


          <!-- SWITCH TO REGISTER -->

          <div class="auth-switch">

            <span>
              New to FamilyFlow?
            </span>

            <button
              type="button"
              class="text-button"
              id="showRegisterButton"
            >
              Create your family space
            </button>

          </div>

        </div>


        <!-- =====================================
             REGISTER VIEW
        ====================================== -->

        <div
          id="registerView"
          class="auth-view"
          hidden
        >

          <div class="auth-heading">

            <span class="welcome-label">
              Create your account
            </span>

            <h2>
              Start your family space
            </h2>

            <p>
              Create one organised place for your children's tasks,
              schedules and daily routines.
            </p>

          </div>


          <form
            id="registerForm"
            class="auth-form"
          >


            <!-- FULL NAME -->

            <div class="form-group">

              <label for="registerName">
                Your name
              </label>

              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <circle
                      cx="12"
                      cy="8"
                      r="4"
                    ></circle>

                    <path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"></path>
                  </svg>

                </span>


                <input
                  type="text"
                  id="registerName"
                  name="name"
                  placeholder="Your full name"
                  autocomplete="name"
                  required
                >

              </div>

            </div>


            <!-- EMAIL -->

            <div class="form-group">

              <label for="registerEmail">
                Email address
              </label>

              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path d="M4 6h16v12H4z"></path>
                    <path d="m4 7 8 6 8-6"></path>
                  </svg>

                </span>


                <input
                  type="email"
                  id="registerEmail"
                  name="email"
                  placeholder="you@example.com"
                  autocomplete="email"
                  required
                >

              </div>

            </div>


            <!-- PASSWORD -->

            <div class="form-group">

              <label for="registerPassword">
                Create password
              </label>

              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    ></rect>

                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>

                  </svg>

                </span>


                <input
                  type="password"
                  id="registerPassword"
                  name="password"
                  placeholder="Create a secure password"
                  autocomplete="new-password"
                  minlength="8"
                  required
                >


                <button
                  type="button"
                  class="password-toggle"
                  id="registerPasswordToggle"
                  aria-label="Show password"
                >

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>

                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                    ></circle>

                  </svg>

                </button>

              </div>

            </div>


            <!-- CONFIRM PASSWORD -->

            <div class="form-group">

              <label for="registerConfirmPassword">
                Confirm password
              </label>

              <div class="input-wrapper">

                <span class="input-icon">

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <rect
                      x="5"
                      y="10"
                      width="14"
                      height="10"
                      rx="2"
                    ></rect>

                    <path d="M8 10V7a4 4 0 0 1 8 0v3"></path>

                  </svg>

                </span>


                <input
                  type="password"
                  id="registerConfirmPassword"
                  name="confirmPassword"
                  placeholder="Enter your password again"
                  autocomplete="new-password"
                  minlength="8"
                  required
                >


                <button
                  type="button"
                  class="password-toggle"
                  id="confirmPasswordToggle"
                  aria-label="Show password"
                >

                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    stroke-width="1.8"
                  >
                    <path
                      d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"
                    ></path>

                    <circle
                      cx="12"
                      cy="12"
                      r="2.5"
                    ></circle>

                  </svg>

                </button>

              </div>

            </div>


            <!-- CREATE ACCOUNT BUTTON -->

            <button
              type="submit"
              class="primary-button"
              id="registerButton"
            >

              <span>
                Create family space
              </span>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <path d="M5 12h14"></path>
                <path d="m14 7 5 5-5 5"></path>
              </svg>

            </button>

          </form>


          <!-- SWITCH BACK TO LOGIN -->

          <div class="auth-switch">

            <span>
              Already have an account?
            </span>

            <button
              type="button"
              class="text-button"
              id="showLoginButton"
            >
              Sign in instead
            </button>

          </div>

        </div>


        <!-- =====================================
             SECURITY NOTE
        ====================================== -->

        <div class="security-note">

          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="1.8"
          >
            <path d="M12 3 5 6v5c0 5 3 8 7 10 4-2 7-5 7-10V6l-7-3Z"></path>
            <path d="m9 12 2 2 4-4"></path>
          </svg>

          <span>
            Your family's information stays private and secure.
          </span>

        </div>

      </div>

    </section>

    <!-- =====================================
     CUSTOM APP DIALOG
====================================== -->

<div
  class="app-dialog-backdrop"
  id="appDialogBackdrop"
  hidden
>

  <div
    class="app-dialog"
    id="appDialog"
    role="dialog"
    aria-modal="true"
    aria-labelledby="appDialogTitle"
  >

    <div
      class="app-dialog-icon success"
      id="appDialogIcon"
    >

      <svg
        class="dialog-success-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M20 6 9 17l-5-5"></path>
      </svg>


      <svg
        class="dialog-error-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <path d="M18 6 6 18"></path>
        <path d="m6 6 12 12"></path>
      </svg>


      <svg
        class="dialog-info-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="9"></circle>
        <path d="M12 11v5"></path>
        <path d="M12 8h.01"></path>
      </svg>

    </div>


    <div class="app-dialog-content">

      <h3 id="appDialogTitle">
        Success
      </h3>

      <p id="appDialogMessage">
        Your action was completed successfully.
      </p>

    </div>


    <button
      type="button"
      class="app-dialog-button"
      id="appDialogButton"
    >
      Continue
    </button>

  </div>

</div>
  </main>
`;

/* =========================================
   AUTH STATE
========================================= */

let initialAuthCheckComplete = false;

let appIsRendered = false;

/* =========================================
   DOM REFERENCES
========================================= */

const loginView = document.querySelector('#loginView');
const registerView = document.querySelector('#registerView');

const loginForm = document.querySelector('#loginForm');
const registerForm = document.querySelector('#registerForm');

const showRegisterButton = document.querySelector('#showRegisterButton');
const showLoginButton = document.querySelector('#showLoginButton');

const forgotPasswordButton = document.querySelector(
  '#forgotPasswordButton'
);
const appDialogBackdrop =
  document.querySelector('#appDialogBackdrop');

const appDialog =
  document.querySelector('#appDialog');

const appDialogIcon =
  document.querySelector('#appDialogIcon');

const appDialogTitle =
  document.querySelector('#appDialogTitle');

const appDialogMessage =
  document.querySelector('#appDialogMessage');

const appDialogButton =
  document.querySelector('#appDialogButton');

  /* =========================================
   CUSTOM APP DIALOG
========================================= */

let dialogCloseCallback = null;


function showAppDialog({
  type = 'info',
  title = 'Notice',
  message = '',
  buttonText = 'Continue',
  onClose = null
}) {

  appDialogIcon.classList.remove(
    'success',
    'error',
    'info'
  );


  appDialogIcon.classList.add(type);


  appDialogTitle.textContent =
    title;


  appDialogMessage.textContent =
    message;


  appDialogButton.textContent =
    buttonText;


  dialogCloseCallback =
    typeof onClose === 'function'
      ? onClose
      : null;


  appDialogBackdrop.hidden =
    false;


  document.body.classList.add(
    'dialog-open'
  );


  requestAnimationFrame(() => {

    appDialogBackdrop.classList.add(
      'is-visible'
    );

  });


  setTimeout(() => {

    appDialogButton.focus();

  }, 100);

}


function closeAppDialog() {

  appDialogBackdrop.classList.remove(
    'is-visible'
  );


  document.body.classList.remove(
    'dialog-open'
  );


  setTimeout(() => {

    appDialogBackdrop.hidden =
      true;


    if (dialogCloseCallback) {

      const callback =
        dialogCloseCallback;


      dialogCloseCallback =
        null;


      callback();

    }

  }, 220);

}


appDialogButton.addEventListener(
  'click',
  closeAppDialog
);


appDialogBackdrop.addEventListener(
  'click',
  (event) => {

    if (event.target === appDialogBackdrop) {

      closeAppDialog();

    }

  }
);


document.addEventListener(
  'keydown',
  (event) => {

    if (
      event.key === 'Escape'
      && !appDialogBackdrop.hidden
    ) {

      closeAppDialog();

    }

  }
);
/* =========================================
   RENDER LOGGED-IN APP
========================================= */

function openFamilyFlowApp(user) {

  if (!user || appIsRendered) {
    return;
  }


  appIsRendered = true;


  renderFamilyFlowApp({
    container: app,
    user
  });


  app.style.visibility = 'visible';

}

/* =========================================
   PASSWORD TOGGLE HELPER
========================================= */

function setupPasswordToggle(inputId, buttonId) {
  const input = document.querySelector(`#${inputId}`);
  const button = document.querySelector(`#${buttonId}`);

  if (!input || !button) {
    return;
  }

  button.addEventListener('click', () => {
    const isPasswordHidden = input.type === 'password';

    input.type = isPasswordHidden
      ? 'text'
      : 'password';

    button.setAttribute(
      'aria-label',
      isPasswordHidden
        ? 'Hide password'
        : 'Show password'
    );
  });
}


setupPasswordToggle(
  'loginPassword',
  'loginPasswordToggle'
);

setupPasswordToggle(
  'registerPassword',
  'registerPasswordToggle'
);

setupPasswordToggle(
  'registerConfirmPassword',
  'confirmPasswordToggle'
);


/* =========================================
   AUTH VIEW SWITCHING
========================================= */

function showLoginView() {
  registerView.hidden = true;
  loginView.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


function showRegisterView() {
  loginView.hidden = true;
  registerView.hidden = false;

  window.scrollTo({
    top: 0,
    behavior: 'smooth'
  });
}


showRegisterButton.addEventListener(
  'click',
  showRegisterView
);


showLoginButton.addEventListener(
  'click',
  showLoginView
);


loginForm.addEventListener('submit', async (event) => {
  event.preventDefault();


  const email = document
    .querySelector('#loginEmail')
    .value
    .trim()
    .toLowerCase();


  const password = document
    .querySelector('#loginPassword')
    .value;


  const rememberMe = document
    .querySelector('#rememberMe')
    .checked;


  const loginButton = document
    .querySelector('#loginButton');


  /* -----------------------------------------
     BASIC VALIDATION
  ----------------------------------------- */

  if (!email || !password) {
    alert('Please enter your email address and password.');

    return;
  }


  try {

    /* -----------------------------------------
       START LOADING STATE
    ----------------------------------------- */

    setButtonLoading(
      loginButton,
      true,
      'Signing you in...'
    );


    /* -----------------------------------------
       SET LOGIN PERSISTENCE
    ----------------------------------------- */

    await setPersistence(
      auth,
      rememberMe
        ? browserLocalPersistence
        : browserSessionPersistence
    );


    /* -----------------------------------------
       SIGN IN WITH FIREBASE
    ----------------------------------------- */

    const userCredential =
      await signInWithEmailAndPassword(
        auth,
        email,
        password
      );


    const user = userCredential.user;


    /* -----------------------------------------
       SUCCESS
    ----------------------------------------- */

    console.log('Signed in successfully:', {
      uid: user.uid,
      email: user.email,
      name: user.displayName
    });


showAppDialog({
  type: 'success',

  title: `Welcome back${user.displayName ? `, ${user.displayName}` : ''}!`,

  message:
    'You have signed in successfully. Your family space is ready.',

  buttonText:
    'Continue',

onClose: () => {
  openFamilyFlowApp(user);
}
});


    /*
      Later this will redirect to the actual app dashboard.

      Example:

      window.location.href = '/app.html';
    */

  } catch (error) {

    const friendlyMessage =
      getFriendlyLoginError(error);


   showAppDialog({
  type: 'error',

  title:
    'Unable to sign in',

  message:
    friendlyMessage,

  buttonText:
    'Try again'
});

  } finally {

    setButtonLoading(
      loginButton,
      false
    );

  }
});


registerForm.addEventListener('submit', async (event) => {
  event.preventDefault();


  const name = document
    .querySelector('#registerName')
    .value
    .trim();


  const email = document
    .querySelector('#registerEmail')
    .value
    .trim()
    .toLowerCase();


  const password = document
    .querySelector('#registerPassword')
    .value;


  const confirmPassword = document
    .querySelector('#registerConfirmPassword')
    .value;


  const registerButton = document.querySelector('#registerButton');


  /* -----------------------------------------
     BASIC VALIDATION
  ----------------------------------------- */

  if (!name || !email || !password || !confirmPassword) {
    alert('Please complete all fields.');

    return;
  }


  if (name.length < 2) {
    alert('Please enter your full name.');

    return;
  }


  if (password !== confirmPassword) {
    alert('The passwords do not match.');

    return;
  }


  if (password.length < 8) {
    alert('Your password must be at least 8 characters long.');

    return;
  }


  let createdUser = null;


  try {

    /* -----------------------------------------
       START LOADING STATE
    ----------------------------------------- */

    setButtonLoading(
      registerButton,
      true,
      'Creating your family space...'
    );


    /* -----------------------------------------
       CREATE FIREBASE AUTH ACCOUNT
    ----------------------------------------- */

    const userCredential =
      await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );


    createdUser = userCredential.user;


    /* -----------------------------------------
       ADD NAME TO FIREBASE AUTH PROFILE
    ----------------------------------------- */

    await updateProfile(createdUser, {
      displayName: name
    });


    /* -----------------------------------------
       CREATE FIRESTORE USER PROFILE
    ----------------------------------------- */

    await setDoc(
      doc(db, 'users', createdUser.uid),
      {
        uid: createdUser.uid,
        name: name,
        email: email,
        role: 'parent',
        onboardingComplete: false,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }
    );


    /* -----------------------------------------
       SUCCESS
    ----------------------------------------- */

    registerForm.reset();


showAppDialog({
  type: 'success',

  title:
    `Welcome to FamilyFlow, ${name}!`,

  message:
    'Your account and family space have been created successfully.',

  buttonText:
    'Continue',

onClose: () => {
  openFamilyFlowApp(createdUser);
}
});


    console.log('Account created successfully:', {
      uid: createdUser.uid,
      email: createdUser.email,
      name: createdUser.displayName
    });

  } catch (error) {

    /*
      If Firebase Authentication succeeded but creating
      the Firestore profile failed, we try to remove the
      newly created Auth account.

      This prevents a broken situation where the email is
      registered in Authentication but no matching user
      profile exists in Firestore.
    */

    if (createdUser) {
      try {
        await deleteUser(createdUser);
      } catch (rollbackError) {
        console.error(
          'Could not roll back partially created account:',
          rollbackError
        );
      }
    }


    const friendlyMessage =
      getFriendlyRegistrationError(error);


   showAppDialog({
  type: 'error',

  title:
    'Unable to create account',

  message:
    friendlyMessage,

  buttonText:
    'Try again'
});

  } finally {

    setButtonLoading(
      registerButton,
      false
    );

  }
});

/* =========================================
   AUTH HELPERS
========================================= */

function setButtonLoading(button, isLoading, loadingText = 'Please wait...') {
  if (!button) {
    return;
  }

  if (isLoading) {
    button.dataset.originalHtml = button.innerHTML;
    button.disabled = true;

    button.innerHTML = `
      <span>${loadingText}</span>
    `;
  } else {
    button.disabled = false;

    if (button.dataset.originalHtml) {
      button.innerHTML = button.dataset.originalHtml;
    }
  }
}


function getFriendlyRegistrationError(error) {
  switch (error.code) {

    case 'auth/email-already-in-use':
      return 'An account already exists with this email address. Please sign in instead.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/weak-password':
      return 'Please choose a stronger password with at least 8 characters.';

    case 'auth/network-request-failed':
      return 'We could not connect to the internet. Please check your connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many attempts have been made. Please wait a moment and try again.';

    default:
      console.error('Registration error:', error);

      return 'Something went wrong while creating your account. Please try again.';
  }
}
function getFriendlyLoginError(error) {
  switch (error.code) {

    case 'auth/invalid-credential':
      return 'The email address or password is incorrect.';

    case 'auth/invalid-email':
      return 'Please enter a valid email address.';

    case 'auth/user-disabled':
      return 'This account has been disabled. Please contact support.';

    case 'auth/too-many-requests':
      return 'Too many unsuccessful sign-in attempts. Please wait a moment and try again.';

    case 'auth/network-request-failed':
      return 'We could not connect to the internet. Please check your connection and try again.';

    default:
      console.error('Login error:', error);

      return 'Something went wrong while signing in. Please try again.';
  }
}

/* =========================================
   FORGOT PASSWORD
========================================= */

forgotPasswordButton.addEventListener('click', () => {
  console.log('Forgot password flow will be connected to Firebase.');
});

/* =========================================
   AUTH STATE OBSERVER
========================================= */

onAuthStateChanged(auth, (user) => {

  /*
    Firebase has now finished determining the
    current authentication state.
  */

  if (!initialAuthCheckComplete) {

    initialAuthCheckComplete = true;


    /*
      Existing authenticated session found.
      Open the dashboard immediately.
    */

    if (user) {

      openFamilyFlowApp(user);

      return;

    }


    /*
      No existing authenticated session.
      Reveal the login / registration screen.
    */

    app.style.visibility = 'visible';

    return;

  }


  /*
    Later auth state changes will be handled here.

    For fresh login or registration, we still let
    the success dialog appear first before opening
    the dashboard.
  */

});