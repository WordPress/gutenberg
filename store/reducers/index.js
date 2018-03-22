/** @format */

export const reducer = ( state = {}, action ) => {
	switch ( action.type ) {
		case 'TEST_ACTION':
			return {
				content: 'Hi From TEST',
			};
		default:
			return state;
	}
};
