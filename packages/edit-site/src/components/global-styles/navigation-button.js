/**
 * WordPress dependencies
 */
import {
	__experimentalNavigatorLink as NavigatorLink,
	__experimentalNavigatorBackLink as NavigatorBackLink,
	__experimentalItem as Item,
	FlexItem,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { Icon } from '@wordpress/icons';

function GenericNavigationButton( { icon, children, ...props } ) {
	return (
		<Item { ...props }>
			{ icon && (
				<HStack justify="flex-start">
					<FlexItem>
						<Icon icon={ icon } size={ 24 } />
					</FlexItem>
					<FlexItem>{ children }</FlexItem>
				</HStack>
			) }
			{ ! icon && children }
		</Item>
	);
}

function NavigationButton( props ) {
	return <NavigatorLink as={ GenericNavigationButton } { ...props } />;
}

function NavigationBackButton( props ) {
	return <NavigatorBackLink as={ GenericNavigationButton } { ...props } />;
}

export { NavigationButton, NavigationBackButton };
