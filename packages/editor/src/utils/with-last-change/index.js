function withLastChange( reducer ) {
	return ( state, action ) => {
		const nextState = reducer( state, action );

		const isChanging = state !== nextState;
		if ( isChanging ) {
			nextState.lastChange = Date.now();
		}

		return nextState;
	};
}

export default withLastChange;
