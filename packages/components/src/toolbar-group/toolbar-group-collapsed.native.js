/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';

function ToolbarGroupCollapsed( { controls = [], className, icon, label } ) {
	return (
		<DropdownMenu
			hasArrowIndicator
			icon={ icon }
			label={ label }
			controls={ controls }
			className={ className }
		/>
	);
}

export default ToolbarGroupCollapsed;
