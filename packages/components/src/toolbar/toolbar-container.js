/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useEffect, useRef, useCallback } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

// When using slots, register/unregister are called with delay, and there's a
// chance that the toolbar is already unmounted when this happens.
function useMountedToolbarState( initialState ) {
	const toolbar = useToolbarState( initialState );
	const mounted = useRef( true );

	useEffect( () => () => {
		mounted.current = false;
	}, [] );

	return {
		...toolbar,
		register: useCallback( ( ...args ) => {
			if ( mounted.current ) {
				toolbar.register( ...args );
			}
		}, [ toolbar.register ] ),
		unregister: useCallback( ( ...args ) => {
			if ( mounted.current ) {
				toolbar.unregister( ...args );
			}
		}, [ toolbar.unregister ] ),
	};
}

function ToolbarContainer( { accessibilityLabel, ...props }, ref ) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	const toolbarState = useMountedToolbarState( { loop: true } );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar
				ref={ ref }
				aria-label={ accessibilityLabel }
				data-toolbar={ true }
				{ ...toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export default forwardRef( ToolbarContainer );
