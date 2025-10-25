/**
 * Action that sets the current path in the global styles navigation.
 *
 * @param {string} path Path to navigate to (e.g., '/', '/revisions', '/css').
 */
export const setStylesPath =
	( path ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_STYLES_PATH',
			path,
		} );
	};

/**
 * Action that sets whether the stylebook preview is visible.
 *
 * @param {boolean} showStylebook Whether to show the stylebook.
 */
export const setShowStylebook =
	( showStylebook ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_SHOW_STYLEBOOK',
			showStylebook,
		} );
	};

/**
 * Action that resets the global styles navigation to its default state.
 */
export const resetStylesNavigation =
	() =>
	( { dispatch } ) => {
		dispatch( {
			type: 'RESET_STYLES_NAVIGATION',
		} );
	};

export function registerRoute( route ) {
	return {
		type: 'REGISTER_ROUTE',
		route,
	};
}

export function unregisterRoute( name ) {
	return {
		type: 'UNREGISTER_ROUTE',
		name,
	};
}
