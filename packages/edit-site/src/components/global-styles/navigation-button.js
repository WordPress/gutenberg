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

function GenericNavigationButton( { icon, children, ...props } ) {
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

function NavigationButtonAsItem( props ) {
	return <Navigator.Button as={ GenericNavigationButton } { ...props } />;
}

function NavigationBackButtonAsItem( props ) {
	return <Navigator.BackButton as={ GenericNavigationButton } { ...props } />;
}

export { NavigationButtonAsItem, NavigationBackButtonAsItem };
