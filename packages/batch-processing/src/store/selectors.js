export const getBatch = ( state, batchId ) => {
	return state.batches[ batchId ];
};

export const getProcessor = ( state, queue ) => {
	return state.processors[ queue ];
};
