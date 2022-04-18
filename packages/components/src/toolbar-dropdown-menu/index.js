/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarItem from '../toolbar-item';
import ToolbarContext from '../toolbar-context';
import DropdownMenu from '../dropdown-menu';

function ToolbarDropdownMenu( props, ref ) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return <DropdownMenu { ...props } />;
	}

	// ToobarItem will pass all props to the render prop child, which will pass
	// all props to the toggle of DropdownMenu. This means that ToolbarDropdownMenu
	// has the same API as DropdownMenu.
	return (
		<ToolbarItem ref={ ref } { ...props.toggleProps }>
			{ ( toolbarItemProps ) => (
				<DropdownMenu
					{ ...props }
					popoverProps={ {
						isAlternate: true,
						...props.popoverProps,
					} }
					toggleProps={ toolbarItemProps }
				/>
			) }
		</ToolbarItem>
	);
}

export default forwardRef( ToolbarDropdownMenu );
