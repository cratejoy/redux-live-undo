# redux-undoable

A generic, high-order reducer that allows you to transparently add undo/redo functionality on top of another redux
reducer.

Inspired by the omnidan's work on [redux-undo](https://github.com/omnidan/redux-undo), redux-undoable provides a simpler
interface with admittedly less options but more flexibility. Most importantly, redux-undoable has the concept of "history
checkpoints" that allow you to dispatch actions without making every change to the state a step in the undo history.

For example, this allows you live updating of UI state (such as in a text input) with creating an undo step for every
single keypress.

redux-undoable also allows you to track entire sections of your application state as a single history so undo/redo
actions can be synced across various types of data.

## Brief Overview

redux-undoable tracks a history of state of its sub-reducers. The state returned by redux-undoable has this shape:
- **present**: the current state of the sub-reducers.
- **past**: an array of past state checkpoints, ordered from oldest to newest.
- **future**: an array of future state checkpoints, order from newest to oldest. Only populated after an undo or redo.

**Note**: New history checkpoints are only recorded when the action dispatched has the `undoableHistoryCheckpoint`
property set to `true`.

## Example Usage

Given a simple reducer that tracks the state of a string:
```js
const TEXT_UPDATE = 'TEXT_UPDATE';

function StringReducer(state = '', action = {}) {
  switch (action.type) {
    case TEXT_UPDATE:
      return action.value;
    default:
      return state;
  }
}
```

Use redux-undoable to add reducer functionality:
```js
import Undoable from 'redux-undoable';

const rootReducer = Undoable({
  string: StringReducer
});
```

When passed to combinedReducers, you will have access to present, past, and future states:
```js
import { createStore } from 'redux';

const store = createStore(rootReducer);
store.getState();
// => {
//   past: [''],
//   present: {
//     string: ''
//   },
//   future: []
// }
```

Dispatch an update as an input changes:
```js
store.dispatch({
  type: TEXT_UPDATE,
  value: 'H'
});

store.getState();
// => {
//   past: [''],
//   present: {
//     string: 'H'
//   },
//   future: []
// }
```

Dispatch an update when the input blurs:
```js
store.dispatch({
  type: TEXT_UPDATE,
  value: 'Hi',
  undoableHistoryCheckpoint: true
});

store.getState();
// => {
//   past: ['', 'Hi'],
//   present: {
//     string: 'Hi'
//   },
//   future: []
// }
```

Undo to the last checkpoint:
```js
import { UNDO } from 'redux-undoable';

store.dispatch({
  type: UNDO
});

store.getState();
// => {
//   past: [''],
//   present: {
//     string: ''
//   },
//   future: ['Hi']
// }
```

Redo the action:
```js
import { REDO } from 'redux-undoable';

store.dispatch({
  type: REDO
});

store.getState();
// => {
//   past: ['', 'Hi'],
//   present: {
//     string: 'Hi'
//   },
//   future: []
// }
```
