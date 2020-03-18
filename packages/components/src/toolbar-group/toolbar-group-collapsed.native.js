/**
 * Internal dependencies
 */
import DropdownMenu from '../dropdown-menu';

function ToolbarGroupCollapsed( { controls = [], ...props } ) {
	return <DropdownMenu controls={ controls } { ...props } />;
}

export default ToolbarGroupCollapsed;
