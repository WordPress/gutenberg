// @ts-nocheck

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

function ToolbarGroupCollapsed( { controls = [], toggleProps, ...props } ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar label="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderDropdownMenu = ( internalToggleProps ) => (
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
