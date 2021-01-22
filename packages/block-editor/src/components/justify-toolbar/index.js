/**
 * External dependencies
 */

/**
 * WordPress dependencies
 */
import { ToolbarGroup } from '@wordpress/components';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
} from '@wordpress/icons';
import { __ } from '@wordpress/i18n';

const navIcons = {
	left: justifyLeft,
	center: justifyCenter,
	right: justifyRight,
	'space-between': justifySpaceBetween,
};

export function JustifyToolbar( {
	handleItemsAlignment,
	itemsJustification,
	popoverProps,
} ) {
	const icon = itemsJustification
		? navIcons[ itemsJustification ]
		: navIcons.left;

	return (
		<ToolbarGroup
			icon={ icon }
			popoverProps={ popoverProps }
			label={ __( 'Change items justification' ) }
			isCollapsed
			controls={ [
				{
					icon: justifyLeft,
					title: __( 'Justify items left' ),
					isActive: 'left' === itemsJustification,
					onClick: handleItemsAlignment( 'left' ),
				},
				{
					icon: justifyCenter,
					title: __( 'Justify items center' ),
					isActive: 'center' === itemsJustification,
					onClick: handleItemsAlignment( 'center' ),
				},
				{
					icon: justifyRight,
					title: __( 'Justify items right' ),
					isActive: 'right' === itemsJustification,
					onClick: handleItemsAlignment( 'right' ),
				},
				{
					icon: justifySpaceBetween,
					title: __( 'Space between items' ),
					isActive: 'space-between' === itemsJustification,
					onClick: handleItemsAlignment( 'space-between' ),
				},
			] }
		/>
	);
}

export default JustifyToolbar;
