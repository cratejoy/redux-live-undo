import { expect } from 'chai';

import { UNDOABLE_UNDO, UNDOABLE_REDO } from '../../constants/ActionTypes';
import Undoable from './Undoable';

const TEST_ACTION = 'TEST';
const testReducer = (state = 0, action = {}) => {
	switch (action.type) {
	case TEST_ACTION:
		return state + 1;
	default:
		return state;
	}
}

const UndoableReducer = Undoable({ test: testReducer });

describe('Undoable', () => {
	describe('initialization', () => {
		it('sets up past/preset/future', () => {
			const initialState = UndoableReducer(undefined, {});
			expect(initialState.past).to.have.length(1);
			expect(initialState.future).to.have.length(0);
			expect(initialState.past[0]).to.deep.equal(initialState.present);
		});

		it('sets each subreducer\'s initial state to a key', () => {
			expect(UndoableReducer(undefined, {}).present).to.deep.equal({ test: 0 });
		});
	});

	describe('arbitrary action', () => {
		it('does not change state', () => {
			const initialState = UndoableReducer(undefined, {});
			expect(UndoableReducer(initialState, { type: 'RANDO_ACTION' })).to.deep.equal(initialState);
		});
	});

	describe('subreducer action', () => {
		context('when undoableHistoryCheckpoint is false', () => {
			let nextState;

			beforeEach(() => {
				const initialState = UndoableReducer(undefined, {});
				nextState = UndoableReducer(initialState, { type: TEST_ACTION, undoableHistoryCheckpoint: false });
			});

			it('updates present to the new value', () => expect(nextState.present).to.deep.equal({ test: 1 }));
			it('does not change past', () => {
				expect(nextState.past).to.have.length(1);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
			});
			it('does not change future', () => expect(nextState.future).to.be.empty);

			context('when there is state in the future array', () => {
				it('clears the future array', () => {
					nextState.future = [{ test: 4 }];
					nextState = UndoableReducer(nextState, { type: TEST_ACTION, undoableHistoryCheckpoint: false });
					expect(nextState.future).to.be.empty;
				});
			});

			context('when past equals next present', () => {
				beforeEach(() => {
					nextState.past = [{ test: 1 }];
					nextState.present = { test: 0 };
					nextState = UndoableReducer(nextState, { type: TEST_ACTION, undoableHistoryCheckpoint: false });
				});

				it('does not update past', () => expect(nextState.past).to.deep.equal([{ test: 1 }]));
				it('updates present to the new value', () => expect(nextState.present).to.deep.equal({ test: 1 }));
			});
		});

		context('when undoableHistoryCheckpoint is true', () => {
			let nextState;

			beforeEach(() => {
				const initialState = UndoableReducer(undefined, {});
				nextState = UndoableReducer(initialState, { type: TEST_ACTION, undoableHistoryCheckpoint: true });
			});

			it('updates present to the new value', () => expect(nextState.present).to.deep.equal({ test: 1 }));
			it('appends the new value onto the past', () => {
				expect(nextState.past).to.have.length(2);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
				expect(nextState.past[1]).to.deep.equal({ test: 1 });
			});
			it('does not change future', () => expect(nextState.future).to.be.empty);

			context('when there is state in the future array', () => {
				it('clears the future array', () => {
					nextState.future = [{ test: 4 }];
					nextState = UndoableReducer(nextState, { type: TEST_ACTION, undoableHistoryCheckpoint: true });
					expect(nextState.future).to.be.empty;
				});
			});
		});
	});

	describe('UNDOABLE_UNDO', () => {
		context('when there is two states in the past array', () => {
			let nextState;

			beforeEach(() => {
				const action = { type: UNDOABLE_UNDO };
				nextState = UndoableReducer({
					past: [
						{ test: 0 },
						{ test: 1 }
					],
					present: { test: 1 },
					future: []
				}, action);
			});

			it('updates present to the previous value', () => expect(nextState.present).to.deep.equal({ test: 0 }));
			it('removes the previous value from the past', () => {
				expect(nextState.past).to.have.length(1);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
			});
			it('appends the last value onto the future', () => {
				expect(nextState.future).to.have.length(1);
				expect(nextState.future[0]).to.deep.equal({ test: 1 });
			});
		});

		context('when there is one state in the past array', () => {
			let nextState;

			beforeEach(() => {
				const action = { type: UNDOABLE_UNDO };
				nextState = UndoableReducer({
					past: [
						{ test: 0 }
					],
					present: { test: 0 },
					future: []
				}, action);
			});

			it('does not change present', () => expect(nextState.present).to.deep.equal({ test: 0 }));
			it('does not change past', () => {
				expect(nextState.past).to.have.length(1);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
			});
		});
	});

	describe('UNDOABLE_REDO', () => {
		context('when there is one states in the future array', () => {
			let nextState;

			beforeEach(() => {
				const action = { type: UNDOABLE_REDO };
				nextState = UndoableReducer({
					past: [
						{ test: 0 }
					],
					present: { test: 0 },
					future: [
						{ test: 1 }
					]
				}, action);
			});

			it('updates present to the last value', () => expect(nextState.present).to.deep.equal({ test: 1 }));
			it('appends the last value to the past', () => {
				expect(nextState.past).to.have.length(2);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
				expect(nextState.past[1]).to.deep.equal({ test: 1 });
			});
			it('removes the last value from the future', () => expect(nextState.future).to.be.empty );
		});

		context('when the future array is empty', () => {
			let nextState;

			beforeEach(() => {
				const action = { type: UNDOABLE_REDO };
				nextState = UndoableReducer({
					past: [
						{ test: 0 }
					],
					present: { test: 0 },
					future: []
				}, action);
			});

			it('does not change present', () => expect(nextState.present).to.deep.equal({ test: 0 }));
			it('does not change past', () => {
				expect(nextState.past).to.have.length(1);
				expect(nextState.past[0]).to.deep.equal({ test: 0 });
			});
		});
	});
});
