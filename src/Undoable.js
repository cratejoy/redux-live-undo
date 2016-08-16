import clone from 'lodash.clone';
import initial from 'lodash.initial';
import last from 'lodash.last';
import mapValues from 'lodash.mapvalues';

import { REDO, UNDO } from './ActionTypes';
import NextState from './NextState';

/*
* Maintains a state tree for the past, present, and future setting values. This tree allows the `present` state to be
* updated live (ie. for every keystroke) while making checkpoints along the way to allow the user to undo and redo
* checkpointed edits. Below is a table that shows how this state tree changes with each action.
*
* New states are generated by child reducers passed in to the reducers argument.
* Usage: combineReducers(Undoable({ settings: settingsReducer }));

| action               | checkpoint | past                                 | present            | future               |
|----------------------|------------|--------------------------------------|--------------------|----------------------|
| initial              |            | `[{ title: "a" }]`                   | `{ title: "a" }`   | `[]`                 |
| UPDATE               | false      | `[{ title: "a" }]`                   | `{ title: "ab" }`  | `[]`                 |
| UPDATE               | false      | `[{ title: "a" }]`                   | `{ title: "abc" }` | `[]`                 |
| UPDATE               | true       | `[{ title: "a" }, { title: "abc" }]` | `{ title: "abc" }` | `[]`                 |
| UNDO                 | --         | `[{ title: "a" }]`                   | `{ title: "a" }`   | `[{ title: "abc" }]` |
| REDO                 | --         | `[{ title: "a" }, { title: "abc" }]` | `{ title: "abc" }` | `[]`                 |

*/
export default function Undoable(reducers) {
	const initialHistory = mapValues(reducers, r => r());

	const initialState = {
		past:    [initialHistory],
		present: initialHistory,
		future:  []
	};

	return (state = initialState, action) => {
		switch (action.type) {
		/*
		* - Concat the present state to the end of the future array.
		* - Copy the last past state to the present state
		* - Remove the last past state
		*/
		case UNDO: {
			// Do not allow undos if there is only one object in the past state.
			if (state.past.length < 2) {
				return state;
			}

			return {
				past:    initial(clone(state.past)), // all but the last one
				present: state.past[state.past.length - 2],
				future:  state.future.concat([state.present])
			};
		}

		/*
		* - Concat the present state to the end of the past array.
		* - Copy the last future state to the present state
		* - Remove the last future state
		*/
		case REDO: {
			// Do not allow undos if there are no objects in the future state.
			if (state.future.length < 1) {
				return state;
			}

			return {
				past:    state.past.concat( [last(state.future) ]),
				present: last(state.future),
				future:  initial(clone(state.future)) // all but last
			};
		}

		/*
		* If this is not a history checkpoint:
		* - Update the present state
		* - Clear the future state
		*
		* If this is a history checkpoint:
		* - Update the present state
		* - Push a copy of the present state into the past state
		* - Clear the future state
		*/
		default: {
			const { nextState, anyChanged } = NextState(reducers, state, action);

			// New states can only be pushed into the history if anything we care about actually changed.
			if (anyChanged) {
				if (action.undoableHistoryCheckpoint) {
					return {
						past:    state.past.concat([nextState]),
						present: nextState,
						future:  []  // clear the future state so we don't lose these new edits by a redo
					};
				} else {
					return Object.assign({}, state, {
						present: nextState,
						future:  []  // clear the future state so we don't lose these new edits by a redo
					});
				}
			} else {
				return Object.assign({}, state, {
					present: nextState
				});
			}
		}}
	}
}
