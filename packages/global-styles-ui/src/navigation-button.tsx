/**
 * WordPress dependencies
 */
import {
	Navigator,
	__experimentalItem as Item,
	FlexItem,
	__experimentalHStack as HStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import { IconWithCurrentColor } from './icon-with-current-color';

interface GenericNavigationButtonProps {
	icon?: any;
	children: React.ReactNode;
	[ key: string ]: any;
}

function GenericNavigationButton( {
	icon,
	children,
	...props
}: GenericNavigationButtonProps ) {
	return (
		<Item { ...props }>
			{ icon && (
				<HStack justify="flex-start">
					<IconWithCurrentColor icon={ icon } size={ 24 } />
					<FlexItem>{ children }</FlexItem>
				</HStack>
			) }
			{ ! icon && children }
		</Item>
	);
}

interface NavigationButtonProps {
	path: string;
	icon?: any;
	children: React.ReactNode;
	[ key: string ]: any;
}

export function NavigationButtonAsItem( props: NavigationButtonProps ) {
	return <Navigator.Button as={ GenericNavigationButton } { ...props } />;
}

export function NavigationBackButtonAsItem( props: NavigationButtonProps ) {
	return <Navigator.BackButton as={ GenericNavigationButton } { ...props } />;
}
