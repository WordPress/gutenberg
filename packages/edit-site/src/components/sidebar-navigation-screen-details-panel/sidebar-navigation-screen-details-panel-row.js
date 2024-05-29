/**
 * External dependencies
 */
import clsx from 'clsx';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

export default function SidebarNavigationScreenDetailsPanelRow( {
	label,
	children,
	className,
	...extraProps
} ) {
	return (
		<HStack
			key={ label }
			spacing={ 5 }
			alignment="left"
			className={ clsx(
				'edit-site-sidebar-navigation-details-screen-panel__row',
				className
			) }
			{ ...extraProps }
		>
			{ children }
		</HStack>
	);
}
