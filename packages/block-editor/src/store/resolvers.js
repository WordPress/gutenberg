export const getFetchedPatterns =
	( fetch ) =>
	async ( { dispatch } ) => {
		const patterns = await fetch();
		dispatch( { type: 'RECEIVE_BLOCK_PATTERNS', patterns } );
	};
