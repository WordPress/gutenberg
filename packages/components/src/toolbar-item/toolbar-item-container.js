/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarItemContainer( { children, ...props }, ref ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	// https://reakit.io/docs/composition/#props-hooks
	const itemProps = useToolbarItem( accessibleToolbarState, {
		...props,
		ref,
	} );

	return children( itemProps );
}

export default forwardRef( ToolbarItemContainer );
