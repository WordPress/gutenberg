export const getAwaitingChunks = ( state, queue, context ) => {
	return state.batches.awaitingChunks[ queue ][ context ];
};

export const getProcessor = ( state, queue ) => {
	return state.processors[ queue ];
};
