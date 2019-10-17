/**
 * External dependencies
 */
import { ToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';
import { __unstableToolbarContext } from '../toolbar';

function ToolbarGroupCollapsed( { controls = [], className, icon, label } ) {
	const accessibleToolbarState = useContext( __unstableToolbarContext );

	const renderDropdownMenu = ( toggleProps ) => (
		<DropdownMenu
			hasArrowIndicator
			icon={ icon }
			label={ label }
			controls={ controls }
			className={ className }
			toggleProps={ toggleProps }
		/>
	);

	if ( accessibleToolbarState ) {
		return (
			<ToolbarItem { ...accessibleToolbarState }>
				{ ( toolbarItemHTMLProps ) => renderDropdownMenu( toolbarItemHTMLProps ) }
			</ToolbarItem>
		);
	}

	return renderDropdownMenu();
}

export default ToolbarGroupCollapsed;
