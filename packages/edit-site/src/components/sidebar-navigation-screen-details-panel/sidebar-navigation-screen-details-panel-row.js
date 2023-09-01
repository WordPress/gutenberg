/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { __experimentalHStack as HStack } from '@wordpress/components';

export default function SidebarNavigationScreenDetailsPanelRow( {
	label,
	children,
	className,
} ) {
	return (
		<HStack
			key={ label }
			spacing={ 5 }
			alignment="left"
			className={ classnames(
				'edit-site-sidebar-navigation-details-screen-panel__row',
				className
			) }
		>
			{ children }
		</HStack>
	);
}
