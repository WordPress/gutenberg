/**
 * WordPress dependencies
 */
import { forwardRef, useContext } from '@wordpress/element';

/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import ToolbarItem from '../toolbar-item';
import ToolbarContext from '../toolbar-context';
import DropdownMenu from '../../dropdown-menu';
import type { DropdownMenuProps } from '../../dropdown-menu/types';

function ToolbarDropdownMenu(
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

export default forwardRef( ToolbarDropdownMenu );
