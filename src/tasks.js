import { auth, db } from './firebase.js';

import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';


/* =========================================
   FAMILYFLOW — TASKS DATA MODULE
========================================= */


/* =========================================
   MODULE STATE
========================================= */

let tasks = [];

let tasksAreLoading = false;


/* =========================================
   CONSTANTS
========================================= */

const allowedTaskCategories = [
  'general',
  'homework',
  'school',
  'chore',
  'appointment',
  'reminder'
];


/* =========================================
   HELPERS
========================================= */

function getCurrentUser() {

  return auth.currentUser;

}


function getUserTasksCollection(userId) {

  return collection(
    db,
    'users',
    userId,
    'tasks'
  );

}


function getUserTaskReference(
  userId,
  taskId
) {

  return doc(
    db,
    'users',
    userId,
    'tasks',
    taskId
  );

}


function cleanString(value = '') {

  return String(value).trim();

}


function getSafeTaskCategory(
  category = 'general'
) {

  return allowedTaskCategories.includes(category)
    ? category
    : 'general';

}


function normaliseDateValue(value = '') {

  const cleanValue =
    cleanString(value);


  if (!cleanValue) {
    return '';
  }


  const validDatePattern =
    /^\d{4}-\d{2}-\d{2}$/;


  return validDatePattern.test(cleanValue)
    ? cleanValue
    : '';

}


function normaliseTimeValue(value = '') {

  const cleanValue =
    cleanString(value);


  if (!cleanValue) {
    return '';
  }


  const validTimePattern =
    /^([01]\d|2[0-3]):[0-5]\d$/;


  return validTimePattern.test(cleanValue)
    ? cleanValue
    : '';

}


function serialiseTaskDocument(
  documentSnapshot
) {

  const data =
    documentSnapshot.data();


  return {

    id:
      documentSnapshot.id,

    childId:
      data.childId || '',

    title:
      data.title || '',

    notes:
      data.notes || '',

    category:
      getSafeTaskCategory(
        data.category
      ),

    dueDate:
      data.dueDate || '',

    dueTime:
      data.dueTime || '',

    completed:
      Boolean(data.completed),

    completedAt:
      data.completedAt || null,

    createdAt:
      data.createdAt || null,

    updatedAt:
      data.updatedAt || null

  };

}


function sortTasks(taskList = []) {

  return [...taskList].sort(
    (taskA, taskB) => {

      /*
        Incomplete tasks first.
      */

      const completedDifference =
        Number(taskA.completed)
        - Number(taskB.completed);


      if (completedDifference !== 0) {
        return completedDifference;
      }


      /*
        Earlier dates first.

        Tasks with no date go to the end.
      */

      const dateA =
        taskA.dueDate || '9999-12-31';


      const dateB =
        taskB.dueDate || '9999-12-31';


      if (dateA !== dateB) {
        return dateA.localeCompare(dateB);
      }


      /*
        Earlier times first.

        Tasks with no time go after
        timed tasks for the same date.
      */

      const timeA =
        taskA.dueTime || '23:59';


      const timeB =
        taskB.dueTime || '23:59';


      if (timeA !== timeB) {
        return timeA.localeCompare(timeB);
      }


      return taskA.title.localeCompare(
        taskB.title
      );

    }
  );

}


function replaceTaskInState(updatedTask) {

  const taskIndex =
    tasks.findIndex(
      (task) =>
        task.id === updatedTask.id
    );


  if (taskIndex === -1) {

    tasks.push(updatedTask);

  } else {

    tasks[taskIndex] = {

      ...tasks[taskIndex],

      ...updatedTask

    };

  }


  tasks =
    sortTasks(tasks);

}


function notifyTasksUpdated() {

  window.dispatchEvent(
    new CustomEvent(
      'familyflow:tasks-updated',
      {
        detail: {

          count:
            tasks.length,

          loading:
            tasksAreLoading,

          tasks:
            tasks.map(
              (task) => ({
                ...task
              })
            )

        }
      }
    )
  );

}


function requireAuthenticatedUser() {

  const user =
    getCurrentUser();


  if (!user) {

    throw new Error(
      'No authenticated user is available.'
    );

  }


  return user;

}


/* =========================================
   DATE HELPERS
========================================= */

export function getTodayDateString() {

  const now =
    new Date();


  const year =
    now.getFullYear();


  const month =
    String(
      now.getMonth() + 1
    ).padStart(2, '0');


  const day =
    String(
      now.getDate()
    ).padStart(2, '0');


  return `${year}-${month}-${day}`;

}


/* =========================================
   LOAD ALL TASKS
========================================= */

export async function loadTasks() {

  const user =
    requireAuthenticatedUser();


  tasksAreLoading =
    true;


  notifyTasksUpdated();


  try {

    const snapshot =
      await getDocs(
        getUserTasksCollection(
          user.uid
        )
      );


    tasks =
      sortTasks(
        snapshot.docs.map(
          serialiseTaskDocument
        )
      );


    return getTasks();

  } catch (error) {

    console.error(
      'Failed to load tasks:',
      error
    );


    tasks = [];


    throw error;

  } finally {

    tasksAreLoading =
      false;


    notifyTasksUpdated();

  }

}


/* =========================================
   LOAD TASKS FOR ONE CHILD
========================================= */

export async function loadTasksForChild(
  childId
) {

  const user =
    requireAuthenticatedUser();


  const safeChildId =
    cleanString(childId);


  if (!safeChildId) {

    throw new Error(
      'A child ID is required to load tasks.'
    );

  }


  const childTasksQuery =
    query(
      getUserTasksCollection(
        user.uid
      ),
      where(
        'childId',
        '==',
        safeChildId
      )
    );


  const snapshot =
    await getDocs(
      childTasksQuery
    );


  const childTasks =
    sortTasks(
      snapshot.docs.map(
        serialiseTaskDocument
      )
    );


  childTasks.forEach(
    replaceTaskInState
  );


  notifyTasksUpdated();


  return childTasks.map(
    (task) => ({
      ...task
    })
  );

}


/* =========================================
   CREATE TASK
========================================= */

export async function createTask({
  childId,
  title,
  notes = '',
  category = 'general',
  dueDate = '',
  dueTime = ''
} = {}) {

  const user =
    requireAuthenticatedUser();


  const safeChildId =
    cleanString(childId);


  const safeTitle =
    cleanString(title);


  const safeNotes =
    cleanString(notes);


  const safeCategory =
    getSafeTaskCategory(category);


  const safeDueDate =
    normaliseDateValue(dueDate);


  const safeDueTime =
    normaliseTimeValue(dueTime);


  /* =========================================
     VALIDATION
  ========================================= */

  if (!safeChildId) {

    throw new Error(
      'Please choose a child for this task.'
    );

  }


  if (safeTitle.length < 2) {

    throw new Error(
      'Please enter a task title.'
    );

  }


  if (safeTitle.length > 120) {

    throw new Error(
      'Task titles cannot be longer than 120 characters.'
    );

  }


  if (safeNotes.length > 500) {

    throw new Error(
      'Task notes cannot be longer than 500 characters.'
    );

  }


  /* =========================================
     FIRESTORE WRITE
  ========================================= */

  const documentReference =
    await addDoc(
      getUserTasksCollection(
        user.uid
      ),
      {

        childId:
          safeChildId,

        title:
          safeTitle,

        notes:
          safeNotes,

        category:
          safeCategory,

        dueDate:
          safeDueDate,

        dueTime:
          safeDueTime,

        completed:
          false,

        completedAt:
          null,

        createdAt:
          serverTimestamp(),

        updatedAt:
          serverTimestamp()

      }
    );


  /* =========================================
     LOCAL STATE
  ========================================= */

  const newTask = {

    id:
      documentReference.id,

    childId:
      safeChildId,

    title:
      safeTitle,

    notes:
      safeNotes,

    category:
      safeCategory,

    dueDate:
      safeDueDate,

    dueTime:
      safeDueTime,

    completed:
      false,

    completedAt:
      null,

    createdAt:
      null,

    updatedAt:
      null

  };


  replaceTaskInState(
    newTask
  );


  notifyTasksUpdated();


  return {
    ...newTask
  };

}


/* =========================================
   UPDATE TASK
========================================= */

export async function updateTask(
  taskId,
  updates = {}
) {

  const user =
    requireAuthenticatedUser();


  const safeTaskId =
    cleanString(taskId);


  if (!safeTaskId) {

    throw new Error(
      'A task ID is required.'
    );

  }


  const existingTask =
    tasks.find(
      (task) =>
        task.id === safeTaskId
    );


  if (!existingTask) {

    throw new Error(
      'The task could not be found.'
    );

  }


  const nextTask = {

    ...existingTask,

    title:
      updates.title !== undefined
        ? cleanString(
            updates.title
          )
        : existingTask.title,

    notes:
      updates.notes !== undefined
        ? cleanString(
            updates.notes
          )
        : existingTask.notes,

    category:
      updates.category !== undefined
        ? getSafeTaskCategory(
            updates.category
          )
        : existingTask.category,

    dueDate:
      updates.dueDate !== undefined
        ? normaliseDateValue(
            updates.dueDate
          )
        : existingTask.dueDate,

    dueTime:
      updates.dueTime !== undefined
        ? normaliseTimeValue(
            updates.dueTime
          )
        : existingTask.dueTime

  };


  if (nextTask.title.length < 2) {

    throw new Error(
      'Please enter a task title.'
    );

  }


  if (nextTask.title.length > 120) {

    throw new Error(
      'Task titles cannot be longer than 120 characters.'
    );

  }


  if (nextTask.notes.length > 500) {

    throw new Error(
      'Task notes cannot be longer than 500 characters.'
    );

  }


  await updateDoc(
    getUserTaskReference(
      user.uid,
      safeTaskId
    ),
    {

      title:
        nextTask.title,

      notes:
        nextTask.notes,

      category:
        nextTask.category,

      dueDate:
        nextTask.dueDate,

      dueTime:
        nextTask.dueTime,

      updatedAt:
        serverTimestamp()

    }
  );


  replaceTaskInState(
    nextTask
  );


  notifyTasksUpdated();


  return {
    ...nextTask
  };

}


/* =========================================
   TOGGLE TASK COMPLETION
========================================= */

export async function toggleTaskCompletion(
  taskId,
  completed
) {

  const user =
    requireAuthenticatedUser();


  const safeTaskId =
    cleanString(taskId);


  const existingTask =
    tasks.find(
      (task) =>
        task.id === safeTaskId
    );


  if (!existingTask) {

    throw new Error(
      'The task could not be found.'
    );

  }


  const nextCompleted =
    Boolean(completed);


  await updateDoc(
    getUserTaskReference(
      user.uid,
      safeTaskId
    ),
    {

      completed:
        nextCompleted,

      completedAt:
        nextCompleted
          ? serverTimestamp()
          : null,

      updatedAt:
        serverTimestamp()

    }
  );


  const updatedTask = {

    ...existingTask,

    completed:
      nextCompleted,

    completedAt:
      nextCompleted
        ? new Date()
        : null

  };


  replaceTaskInState(
    updatedTask
  );


  notifyTasksUpdated();


  return {
    ...updatedTask
  };

}


/* =========================================
   DELETE TASK
========================================= */

export async function deleteTask(
  taskId
) {

  const user =
    requireAuthenticatedUser();


  const safeTaskId =
    cleanString(taskId);


  if (!safeTaskId) {

    throw new Error(
      'A task ID is required.'
    );

  }


  await deleteDoc(
    getUserTaskReference(
      user.uid,
      safeTaskId
    )
  );


  tasks =
    tasks.filter(
      (task) =>
        task.id !== safeTaskId
    );


  notifyTasksUpdated();


  return true;

}


/* =========================================
   READ LOCAL TASK STATE
========================================= */

export function getTasks() {

  return tasks.map(
    (task) => ({
      ...task
    })
  );

}


export function getTasksForChild(
  childId
) {

  const safeChildId =
    cleanString(childId);


  return tasks
    .filter(
      (task) =>
        task.childId === safeChildId
    )
    .map(
      (task) => ({
        ...task
      })
    );

}


export function getTasksForDate(
  date
) {

  const safeDate =
    normaliseDateValue(date);


  return tasks
    .filter(
      (task) =>
        task.dueDate === safeDate
    )
    .map(
      (task) => ({
        ...task
      })
    );

}


export function getTodayTasks() {

  return getTasksForDate(
    getTodayDateString()
  );

}


export function getTaskById(
  taskId
) {

  const safeTaskId =
    cleanString(taskId);


  const task =
    tasks.find(
      (item) =>
        item.id === safeTaskId
    );


  return task
    ? {
        ...task
      }
    : null;

}


export function getTasksLoadingState() {

  return tasksAreLoading;

}