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

function ToolbarGroupCollapsed( {
	controls = [],
	toggleProps,
	...props
}: ToolbarGroupCollapsedProps ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar label="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderDropdownMenu = (
		internalToggleProps?: Record< string, any > // ExtractHTMLAttributes<any>
	) => (
		<DropdownMenu
			// TODO: Any idea how best to solve this
			// @ts-expect-error Dropdown Menu expects dropdown menu types.
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
