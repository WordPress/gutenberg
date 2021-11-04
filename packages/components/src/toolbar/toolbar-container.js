/**
 * External dependencies
 */
import { useToolbarState, Toolbar } from 'ariakit/toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef } from '@wordpress/element';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarContainer( { label, ...props }, ref ) {
	const toolbarState = useToolbarState( {
		focusLoop: true,
		rtl: isRTL(),
	} );

	return (
		// This will provide state for `ToolbarButton`'s
		<ToolbarContext.Provider value={ toolbarState }>
			<Toolbar
				ref={ ref }
				aria-label={ label }
				state={ toolbarState }
				{ ...props }
			/>
		</ToolbarContext.Provider>
	);
}

export default forwardRef( ToolbarContainer );
