export const getBatch = ( state, batchId ) => {
	return state.batches[ batchId ];
};

export const getProcessor = ( state, queue ) => {
	return state.processors[ queue ];
};

export const getPromise = ( state, queue, context ) => {
	return state.promises[ queue ]?.[ context ];
};

export const getPromises = ( state, queue ) => {
	return Object.values( state.promises[ queue ] || {} ).map(
		( { promise } ) => promise
	);
};
