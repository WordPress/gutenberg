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
	FlexBlock,
} from '@wordpress/components';
import { chevronRightSmall, Icon } from '@wordpress/icons';

export default function SidebarNavigationItem( {
	className,
	icon,
	withChevron = false,
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
					<FlexBlock>{ children }</FlexBlock>
					{ withChevron && (
						<Icon
							className="edit-site-sidebar-navigation-item__chevron"
							icon={ chevronRightSmall }
							size={ 24 }
						/>
					) }
				</HStack>
			) }
			{ ! icon && children }
		</Item>
	);
}
