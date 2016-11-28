# redux-live-undo

A generic, high-order reducer that allows you to transparently add undo/redo functionality on top of other redux
reducers. redux-live-undo allows state to be updated as users type without creating undo steps for every state change.

[![CircleCI](https://circleci.com/gh/cratejoy/redux-live-undo.svg?style=svg)](https://circleci.com/gh/cratejoy/redux-live-undo)

Inspired by the omnidan's work on [redux-undo](https://github.com/omnidan/redux-undo), redux-live-undo provides a simpler
interface with admittedly less options but more flexibility. Most importantly, redux-live-undo has the concept of "history
checkpoints" that allow you to dispatch actions without making every change to the state a step in the undo history.

For example, this allows you live updating of UI state (such as in a text input) without creating an undo step for every
single keypress.

redux-live-undo also allows you to track entire sections of your application state as a single history so undo/redo
actions can be synced across various types of data.

## Brief Overview

redux-live-undo tracks a history of state of its sub-reducers. The state returned by redux-live-undo has this shape:
- **present**: the current state of the sub-reducers.
- **past**: an array of past state checkpoints, ordered from oldest to newest.
- **future**: an array of future state checkpoints, order from newest to oldest. Only populated after an undo or redo.

**Note**: New history checkpoints are only recorded when the action dispatched has the `undoableHistoryCheckpoint`
property set to `true` and `changeDetector` returns true.

Reducers can optionally provide a `changeDetector` function to override what changes are allowed to be checkpointable.

## Action flags

Flags on actions can affect the behavior of the undo history state:
- `undoableHistoryCheckpoint`: Marks when the next state should be considered a checkpoint in the undo history
- `undoableIrreversibleCheckpoint`: Marks when the next state should clear any undo history. Typically used if related
state in another system (eg. a backend service) cannot be reversed.

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

Use redux-live-undo to add reducer functionality:
```js
import Undoable from 'redux-live-undo';

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

Dispatch an update with a checkpoint when you want a snapshot to jump back to, for example, when the input blurs:
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
import { UNDO } from 'redux-live-undo';

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
import { REDO } from 'redux-live-undo';

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

## Credits

- @joshdover
- @tornstrom
