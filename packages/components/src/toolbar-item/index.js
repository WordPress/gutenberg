/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';

function ToolbarItem( { children, ...props }, ref ) {
	const accessibleToolbarState = useContext( ToolbarContext );
	// https://reakit.io/docs/composition/#props-hooks
	const itemProps = useToolbarItem( accessibleToolbarState, {
		...props,
		ref,
	} );

	if ( typeof children !== 'function' ) {
		warning(
			'`ToolbarItem` is a generic headless component that accepts only function children props'
		);
		return null;
	}

	if ( ! accessibleToolbarState ) {
		warning(
			'`ToolbarItem` should be rendered within `<Toolbar __experimentalAccessibilityLabel="label">`'
		);
		return null;
	}

	return children( itemProps );
}

export default forwardRef( ToolbarItem );
