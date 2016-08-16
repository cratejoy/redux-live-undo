import { expect } from 'chai';

import NextState from '../src/NextState';
import TestReducer, { TEST_ACTION, SAME_ACTION} from './TestReducer.test';

describe('NextState', () => {
	const reducers = { test: TestReducer };
	const state = {
		past: [{ test: 0 }],
		present: { test: 0 },
		future: []
	};

	const get = (actionType) => {
		return NextState(reducers, state, { type: actionType });
	}

	context('when no changeDetector is defined', () => {
		it('returns true when changed', () => expect(get(TEST_ACTION).anyChanged).to.be.true);
		it('returns false when unchanged', () => expect(get(SAME_ACTION).anyChanged).to.be.false);
		it('returns the next state', () => expect(get(TEST_ACTION).nextState).to.deep.equal({ test: 1 }));
	});

	context('when changeDetector always returns true', () => {
		before(() => TestReducer.changeDetector = () => true);
		after(() => delete TestReducer.changeDetector);

		it('returns true when changed', () => expect(get(TEST_ACTION).anyChanged).to.be.true);
		it('returns true when unchanged', () => expect(get(SAME_ACTION).anyChanged).to.be.true);
		it('returns the next state', () => expect(get(TEST_ACTION).nextState).to.deep.equal({ test: 1 }));
	});

	context('when changeDetector always returns false', () => {
		before(() => TestReducer.changeDetector = () => false);
		after(() => delete TestReducer.changeDetector);

		it('returns false when changed', () => expect(get(TEST_ACTION).anyChanged).to.be.false);
		it('returns false when unchanged', () => expect(get(SAME_ACTION).anyChanged).to.be.false);
		it('returns the next state', () => expect(get(TEST_ACTION).nextState).to.deep.equal({ test: 1 }));
	});
});
