import isEqual from 'lodash.isequal';
import last from 'lodash.last';
import mapValues from 'lodash.mapvalues';
import some from 'lodash.some';

const DEFAULT_CHANGE_DETECTOR = (lastState, nextState) => {
	return !isEqual(lastState, nextState);
};

const getNextState = (reducers, state, action) => {
	const subValues = mapValues(reducers, (r, k) => {
		const nextState = r(state.present[k], action);
		const changeDetector = r.changeDetector || DEFAULT_CHANGE_DETECTOR;

		const lastState = last(state.past) ? last(state.past)[k] : undefined;
		const changed = changeDetector(lastState, nextState);

		return {
			changed,
			nextState
		};
	});

	const nextState = mapValues(subValues, 'nextState');
	const anyChanged = some(mapValues(subValues, 'changed'));

	return { nextState, anyChanged };
}

export default getNextState;
