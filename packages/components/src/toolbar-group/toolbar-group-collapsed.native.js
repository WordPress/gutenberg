/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';

function ToolbarGroupCollapsed( { controls = [], ...props } ) {
	return (
		<DropdownMenu hasArrowIndicator controls={ controls } { ...props } />
	);
}

export default ToolbarGroupCollapsed;
