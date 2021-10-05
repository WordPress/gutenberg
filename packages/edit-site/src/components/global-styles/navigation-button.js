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

function NavigationButton( {
	path,
	icon,
	children,
	isBack = false,
	...props
} ) {
	const navigator = useNavigator();
	return (
		<Item onClick={ () => navigator.push( path, { isBack } ) } { ...props }>
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

export default NavigationButton;
