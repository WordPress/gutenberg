import type { ComponentProps, ComponentType } from 'react';
import { ToolbarDropdownMenu, ToolbarGroup } from '@wordpress/components';
import {
	justifyLeft,
	justifyCenter,
	justifyRight,
	justifySpaceBetween,
	justifySpaceAround,
	justifySpaceEvenly,
	justifyStretch,
} from '@wordpress/icons';
import { __, _x } from '@wordpress/i18n';
import type { JustifyContentUIProps, JustifyContentValue } from './types';

const icons = {
	left: justifyLeft,
	center: justifyCenter,
	right: justifyRight,
	'space-between': justifySpaceBetween,
	'space-around': justifySpaceAround,
	'space-evenly': justifySpaceEvenly,
	stretch: justifyStretch,
};

function JustifyContentUI( {
	allowedControls = [
		'left',
		'center',
		'right',
		'space-between',
		'space-around',
		'space-evenly',
	],
	isCollapsed = true,
	onChange,
	value,
	popoverProps,
	isToolbar,
}: JustifyContentUIProps ) {
	// If the control is already selected we want a click
	// again on the control to deselect the item, so we
	// call onChange( undefined )
	const handleClick = ( next: JustifyContentValue ) => {
		if ( next === value ) {
			onChange( undefined );
		} else {
			onChange( next );
		}
	};

	const icon = value ? icons[ value ] : icons.left;
	const allControls = [
		{
			name: 'left',
			icon: justifyLeft,
			title: _x( 'Left', 'Flex layout justification option' ),
			isActive: 'left' === value,
			onClick: () => handleClick( 'left' ),
		},
		{
			name: 'center',
			icon: justifyCenter,
			title: _x( 'Center', 'Flex layout justification option' ),
			isActive: 'center' === value,
			onClick: () => handleClick( 'center' ),
		},
		{
			name: 'right',
			icon: justifyRight,
			title: _x( 'Right', 'Flex layout justification option' ),
			isActive: 'right' === value,
			onClick: () => handleClick( 'right' ),
		},
		{
			name: 'space-between',
			icon: justifySpaceBetween,
			title: __( 'Space between' ),
			isActive: 'space-between' === value,
			onClick: () => handleClick( 'space-between' ),
		},
		{
			name: 'space-around',
			icon: justifySpaceAround,
			title: __( 'Space around' ),
			isActive: 'space-around' === value,
			onClick: () => handleClick( 'space-around' ),
		},
		{
			name: 'space-evenly',
			icon: justifySpaceEvenly,
			title: __( 'Space evenly' ),
			isActive: 'space-evenly' === value,
			onClick: () => handleClick( 'space-evenly' ),
		},
		{
			name: 'stretch',
			icon: justifyStretch,
			title: __( 'Stretch items' ),
			isActive: 'stretch' === value,
			onClick: () => handleClick( 'stretch' ),
		},
	];

	// Both take these props; `ToolbarGroup`'s types also require a `title`
	// for a collapsed group, which was never passed.
	const UIComponent = (
		isToolbar ? ToolbarGroup : ToolbarDropdownMenu
	) as ComponentType<
		ComponentProps< typeof ToolbarDropdownMenu > & { isCollapsed?: boolean }
	>;
	const extraProps = isToolbar ? { isCollapsed } : {};

	return (
		<UIComponent
			icon={ icon }
			popoverProps={ popoverProps }
			label={ __( 'Change items justification' ) }
			controls={ allControls.filter( ( elem ) =>
				// Every control is named after a justification.
				allowedControls.includes( elem.name as JustifyContentValue )
			) }
			{ ...extraProps }
		/>
	);
}

export default JustifyContentUI;
