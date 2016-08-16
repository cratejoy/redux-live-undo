export const TEST_ACTION = 'TEST';
export const SAME_ACTION = 'SAME';

const TestReducer = (state = 0, action = {}) => {
	switch (action.type) {
	case TEST_ACTION:
		return state + 1;
	case SAME_ACTION:
		return state;
	default:
		return state;
	}
}

export default TestReducer;
