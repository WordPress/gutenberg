export const getTransaction = ( state, transactionId ) => {
	return state.batches.transactions[ transactionId ];
};

export const getProcessor = ( state, queue ) => {
	return state.processors[ queue ];
};
