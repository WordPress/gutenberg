import { forwardRef, useContext } from '@wordpress/element';
import type { ForwardedRef } from 'react';
import ToolbarItem from '../toolbar-item';
import ToolbarContext from '../toolbar-context';
import DropdownMenu from '../../dropdown-menu';
import type { DropdownMenuProps } from '../../dropdown-menu/types';

function UnforwardedToolbarDropdownMenu(
	props: DropdownMenuProps,
	ref: ForwardedRef< any >
) {
	const accessibleToolbarState = useContext( ToolbarContext );

	if ( ! accessibleToolbarState ) {
		return <DropdownMenu { ...props } />;
	}

	// ToolbarItem will pass all props to the render prop child, which will pass
	// all props to the toggle of DropdownMenu. This means that ToolbarDropdownMenu
	// has the same API as DropdownMenu.
	return (
		<ToolbarItem ref={ ref } { ...props.toggleProps }>
			{ ( toolbarItemProps ) => (
				<DropdownMenu
					{ ...props }
					popoverProps={ {
						...props.popoverProps,
					} }
					toggleProps={ toolbarItemProps }
				/>
			) }
		</ToolbarItem>
	);
}

export const ToolbarDropdownMenu = forwardRef( UnforwardedToolbarDropdownMenu );
ToolbarDropdownMenu.displayName = 'ToolbarDropdownMenu';
export default ToolbarDropdownMenu;
