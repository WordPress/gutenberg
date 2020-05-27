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
	// Passing baseId for server side rendering (which includes snapshots)
	// If an id prop is passed to Toolbar, toolbar items will use it as a base for their ids
	const toolbarState = useToolbarState( { loop: true, baseId: props.id } );

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
