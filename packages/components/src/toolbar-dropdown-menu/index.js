/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ToolbarItem from '../toolbar-item';
import ToolbarContext from '../toolbar-context';
import DropdownMenu from '../dropdown-menu';

function ToolbarDropdownMenu( props ) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return <DropdownMenu { ...props } />;
	}

	// ToobarItem will pass all props to the render prop child, which will pass
	// all props to the toggle of DrpodownMenu. This means that ToolbarDropdownMenu has the same API as
	// DrpodownMenu.
	return (
		<ToolbarItem>
			{ ( toolbarItemProps ) => (
				<DropdownMenu
					{ ...props }
					toggleProps={
						props.toggleProps
							? {
									...props.toggleProps,
									...toolbarItemProps,
							  }
							: toolbarItemProps
					}
				/>
			) }
		</ToolbarItem>
	);
}

export default ToolbarDropdownMenu;
