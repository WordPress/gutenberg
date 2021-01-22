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

export function JustifyToolbar( { onChange, value, popoverProps } ) {
	const icon = value ? navIcons[ value ] : navIcons.left;

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
					isActive: 'left' === value,
					onClick: onChange( 'left' ),
				},
				{
					icon: justifyCenter,
					title: __( 'Justify items center' ),
					isActive: 'center' === value,
					onClick: onChange( 'center' ),
				},
				{
					icon: justifyRight,
					title: __( 'Justify items right' ),
					isActive: 'right' === value,
					onClick: onChange( 'right' ),
				},
				{
					icon: justifySpaceBetween,
					title: __( 'Space between items' ),
					isActive: 'space-between' === value,
					onClick: onChange( 'space-between' ),
				},
			] }
		/>
	);
}

export default JustifyToolbar;
