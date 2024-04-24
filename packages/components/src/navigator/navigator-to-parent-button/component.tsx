/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { View } from '../../view';
import { useNavigatorBackButton } from '../navigator-back-button/hook';
import type { NavigatorToParentButtonProps } from '../types';

function UnconnectedNavigatorToParentButton(
	props: WordPressComponentProps< NavigatorToParentButtonProps, 'button' >,
	forwardedRef: ForwardedRef< any >
) {
	const navigatorToParentButtonProps = useNavigatorBackButton( {
		...props,
		goToParent: true,
	} );

	return <View ref={ forwardedRef } { ...navigatorToParentButtonProps } />;
}

/*
 * The `Navigator.ToParentButton` component can be used to navigate to a screen and
 * should be used in combination with the `NavigatorProvider` (alias `Navigator`), the
 * `Navigator.Screen` and the `Navigator.Button` components (or the `useNavigator`
 * hook).
 *
 * @example
 * ```jsx
 * import {
 *   Navigator,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <Navigator initialPath="/">
 *     <Navigator.Screen path="/">
 *       <p>This is the home screen.</p>
 *        <Navigator.Button path="/child">
 *          Navigate to child screen.
 *       </Navigator.Button>
 *     </Navigator.Screen>
 *
 *     <Navigator.Screen path="/child">
 *       <p>This is the child screen.</p>
 *       <Navigator.ToParentButton>
 *         Go to parent
 *       </Navigator.ToParentButton>
 *     </Navigator.Screen>
 *   </Navigator>
 * );
 * ```
 */
export const NavigatorToParentButton = contextConnect(
	UnconnectedNavigatorToParentButton,
	'Navigator.ToParentButton'
);

export default NavigatorToParentButton;
