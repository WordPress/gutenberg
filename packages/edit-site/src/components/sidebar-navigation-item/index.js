/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	__experimentalItem as Item,
	__experimentalHStack as HStack,
	FlexItem,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';

export default function SidebarNavigationItem( {
	className,
	icon,
	children,
	...props
} ) {
	return (
		<Item
			className={ classnames(
				'edit-site-sidebar-navigation-item',
				className
			) }
			{ ...props }
		>
			{ icon && (
				<HStack justify="flex-start">
					<Icon
						style={ { fill: 'currentcolor' } }
						icon={ icon }
						size={ 24 }
					/>
					<FlexItem>{ children }</FlexItem>
				</HStack>
			) }
			{ ! icon && children }
		</Item>
	);
}
