/**
 * Action that switches the editor canvas container view.
 *
 * @param {?string} view Editor canvas container view.
 */
export const setEditorCanvasContainerView =
	( view ) =>
	( { dispatch } ) => {
		dispatch( {
			type: 'SET_EDITOR_CANVAS_CONTAINER_VIEW',
			view,
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
