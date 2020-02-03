/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import ToolbarContext from '../toolbar-context';
import ToolbarItemContainer from './toolbar-item-container';

function ToolbarItem( { children, ...props }, ref ) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( typeof children !== 'function' ) {
		warning(
			'`ToolbarItem` is a generic headless component that accepts only function children props'
		);
		return null;
	}

	const allProps = { ...props, ref, 'data-experimental-toolbar-item': true };

	if ( ! accessibleToolbarState ) {
		return children( allProps );
	}

	return (
		<ToolbarItemContainer { ...allProps }>
			{ children }
		</ToolbarItemContainer>
	);
}

export default forwardRef( ToolbarItem );
