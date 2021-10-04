/**
 * WordPress dependencies
 */
import {
	__experimentalUseNavigator as useNavigator,
	__experimentalItem as Item,
	FlexItem,
	__experimentalHStack as HStack,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon } from '@wordpress/icons';

function NavigationButton( {
	path,
	icon,
	children,
	label: labelProp,
	isBack = false,
	...props
} ) {
	const navigator = useNavigator();

	const defaultLabel = isBack
		? __( 'Navigate to the previous screen' )
		: undefined;

	return (
		<Item
			onClick={ () => navigator.push( path, { isBack } ) }
			aria-label={ labelProp ?? defaultLabel }
			{ ...props }
		>
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
