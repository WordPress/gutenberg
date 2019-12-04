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
import ToolbarContext from '../toolbar-context';

function ToolbarGroupCollapsed( {
	controls = [],
	className,
	icon,
	label,
	...props
} ) {
	// It'll contain state if `ToolbarGroup` is being used within
	// `<Toolbar __experimentalAccessibilityLabel="label" />`
	const accessibleToolbarState = useContext( ToolbarContext );

	const renderDropdownMenu = ( toggleProps ) => (
		<DropdownMenu
			hasArrowIndicator
			icon={ icon }
			label={ label }
			controls={ controls }
			className={ className }
			toggleProps={ toggleProps }
			{ ...props }
		/>
	);

	if ( accessibleToolbarState ) {
		return (
			// https://reakit.io/docs/composition/#render-props
			<ToolbarItem { ...accessibleToolbarState }>
				{ ( toolbarItemHTMLProps ) => renderDropdownMenu( toolbarItemHTMLProps ) }
			</ToolbarItem>
		);
	}

	return renderDropdownMenu();
}

export default ToolbarGroupCollapsed;
