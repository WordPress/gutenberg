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

const icons = {
	left: justifyLeft,
	center: justifyCenter,
	right: justifyRight,
	'space-between': justifySpaceBetween,
};

export function JustifyToolbar( {
	allowedControls = [ 'left', 'center', 'right', 'space-between' ],
	isCollapsed = true,
	onChange,
	value,
	popoverProps,
} ) {
	const icon = value ? icons[ value ] : icons.left;
	const allControls = [
		{
			name: 'left',
			icon: justifyLeft,
			title: __( 'Justify items left' ),
			isActive: 'left' === value,
			onClick: onChange( 'left' ),
		},
		{
			name: 'center',
			icon: justifyCenter,
			title: __( 'Justify items center' ),
			isActive: 'center' === value,
			onClick: onChange( 'center' ),
		},
		{
			name: 'right',
			icon: justifyRight,
			title: __( 'Justify items right' ),
			isActive: 'right' === value,
			onClick: onChange( 'right' ),
		},
		{
			name: 'space-between',
			icon: justifySpaceBetween,
			title: __( 'Space between items' ),
			isActive: 'space-between' === value,
			onClick: onChange( 'space-between' ),
		},
	];

	return (
		<ToolbarGroup
			icon={ icon }
			popoverProps={ popoverProps }
			label={ __( 'Change items justification' ) }
			isCollapsed={ isCollapsed }
			controls={ allControls.filter( ( elem ) =>
				allowedControls.includes( elem.name )
			) }
		/>
	);
}

export default JustifyToolbar;
