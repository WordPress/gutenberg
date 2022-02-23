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
	const { goTo } = useNavigator();

	const dataAttrName = 'data-navigator-focusable-id';
	const dataAttrValue = path;

	const dataAttrCssSelector = `[${ dataAttrName }="${ dataAttrValue }"]`;

	const buttonProps = {
		...props,
		[ dataAttrName ]: dataAttrValue,
	};

	return (
		<GenericNavigationButton
			onClick={ () =>
				goTo( path, { focusTargetSelector: dataAttrCssSelector } )
			}
			{ ...buttonProps }
		/>
	);
}

function NavigationBackButton( { ...props } ) {
	const { goBack } = useNavigator();
	return <GenericNavigationButton onClick={ goBack } { ...props } />;
}

export { NavigationButton, NavigationBackButton };
