/**
 * WordPress dependencies
 */
import {
	__experimentalUseNavigator as useNavigator,
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
function NavigationButton( { path, ...props } ) {
	const { push } = useNavigator();
	return (
		<GenericNavigationButton onClick={ () => push( path ) } { ...props } />
	);
}

function NavigationBackButton( { ...props } ) {
	const { pop } = useNavigator();
	return <GenericNavigationButton onClick={ pop } { ...props } />;
}

export { NavigationButton, NavigationBackButton };
