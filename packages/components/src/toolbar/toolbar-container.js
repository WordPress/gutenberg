/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarContainer( { accessibilityLabel, ...props }, ref ) {
	// https://reakit.io/docs/basic-concepts/#state-hooks
	const toolbarState = useToolbarState( { loop: true } );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar
				ref={ ref }
				aria-label={ accessibilityLabel }
				{ ...toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export default forwardRef( ToolbarContainer );
