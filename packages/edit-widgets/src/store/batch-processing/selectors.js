
export const getPromise = ( state, queue, context ) => {
	return state.promises[ queue ]?.[ context ];
};
