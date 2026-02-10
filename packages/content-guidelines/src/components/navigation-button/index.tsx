/**
 * WordPress dependencies
 */
import {
	__experimentalHStack as HStack,
	__experimentalVStack as VStack,
	__experimentalText as Text,
	__experimentalItem as Item,
	FlexItem,
	Icon,
	Navigator,
} from '@wordpress/components';
import { isRTL } from '@wordpress/i18n';
import { chevronRight, chevronLeft } from '@wordpress/icons';

interface NavigationButtonAsItemProps {
	path: string;
	children: React.ReactNode;
}

/**
 * A Navigator.Button styled as an Item for use in ItemGroups.
 *
 * @param root0          Component props.
 * @param root0.path     The navigator path to navigate to.
 * @param root0.children The content to render inside the item.
 */
export function NavigationButtonAsItem( {
	path,
	children,
}: NavigationButtonAsItemProps ) {
	return (
		<Navigator.Button as={ Item } path={ path }>
			{ children }
		</Navigator.Button>
	);
}

interface SummaryNavigationButtonProps {
	path: string;
	icon: any;
	title: string;
	description: string;
}

/**
 * A navigation button with icon, title, description, and chevron.
 *
 * @param root0             Component props.
 * @param root0.path        The navigator path to navigate to.
 * @param root0.icon        The icon to display.
 * @param root0.title       The title text.
 * @param root0.description The description text.
 */
export function SummaryNavigationButton( {
	path,
	icon,
	title,
	description,
}: SummaryNavigationButtonProps ) {
	return (
		<NavigationButtonAsItem path={ path }>
			<HStack justify="space-between" expanded>
				<HStack justify="flex-start" expanded={ false }>
					<Icon icon={ icon } size={ 24 } />
					<VStack spacing={ 1 }>
						<span>{ title }</span>
						<Text variant="muted" size="12px">
							{ description }
						</Text>
					</VStack>
				</HStack>
				<FlexItem display="flex">
					<Icon icon={ isRTL() ? chevronLeft : chevronRight } />
				</FlexItem>
			</HStack>
		</NavigationButtonAsItem>
	);
}
