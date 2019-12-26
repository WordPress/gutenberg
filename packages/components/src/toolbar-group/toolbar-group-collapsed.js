/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';
import ToolbarContext from '../toolbar-context';
import ToolbarItem from '../toolbar-item';

function ToolbarGroupCollapsed( { controls = [], ...props } ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar __experimentalAccessibilityLabel="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderDropdownMenu = ( toggleProps ) => (
		<DropdownMenu
			hasArrowIndicator
			controls={ controls }
			toggleProps={ toggleProps }
			{ ...props }
		/>
	);

	if ( accessibleToolbarState ) {
		return <ToolbarItem>{ renderDropdownMenu }</ToolbarItem>;
	}

	return renderDropdownMenu();
}

export default ToolbarGroupCollapsed;
