/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropdownMenu from '../../dropdown-menu';
import ToolbarContext from '../toolbar-context';
import ToolbarItem from '../toolbar-item';
import type { ToolbarGroupCollapsedProps } from './types';
import type { DropdownMenuProps } from '../../dropdown-menu/types';

function ToolbarGroupCollapsed( {
	controls = [],
	toggleProps,
	...props
}: ToolbarGroupCollapsedProps ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar label="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderDropdownMenu = (
		internalToggleProps?: DropdownMenuProps[ 'toggleProps' ]
	) => (
		<DropdownMenu
			controls={ controls }
			toggleProps={ {
				...internalToggleProps,
				'data-toolbar-item': true,
			} }
			{ ...props }
		/>
	);

	if ( accessibleToolbarState ) {
		return (
			<ToolbarItem { ...toggleProps }>{ renderDropdownMenu }</ToolbarItem>
		);
	}

	return renderDropdownMenu( toggleProps );
}

export default ToolbarGroupCollapsed;
