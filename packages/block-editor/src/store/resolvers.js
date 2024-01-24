export const getFetchedPatterns =
	() =>
	async ( { dispatch, select } ) => {
		const { __experimentalFetchBlockPatterns } = select.getSettings();
		if ( ! __experimentalFetchBlockPatterns ) {
			return [];
		}
		const patterns = await __experimentalFetchBlockPatterns();
		dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
	};

getFetchedPatterns.shouldInvalidate = ( action ) => {
	return (
		action.type === 'UPDATE_SETTINGS' &&
		!! action.settings.__experimentalFetchBlockPatterns
	);
};
