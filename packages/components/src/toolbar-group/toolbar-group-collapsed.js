/**
 * External dependencies
 */
import { useToolbarItem } from 'reakit/Toolbar';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';
import ToolbarContext from '../toolbar-context';

function ToolbarGroupCollapsed( { controls = [], className, icon, label, toggleProps } ) {
	const context = useContext( ToolbarContext );
	const itemProps = useToolbarItem( context, toggleProps );
	return (
		<DropdownMenu
			hasArrowIndicator
			icon={ icon }
			label={ label }
			controls={ controls }
			className={ className }
			toggleProps={ itemProps }
		/>
	);
}

export default ToolbarGroupCollapsed;
