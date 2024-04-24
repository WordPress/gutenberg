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
import { useNavigatorBackButton } from './hook';
import type { NavigatorBackButtonProps } from '../types';

function UnconnectedNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button' >,
	forwardedRef: ForwardedRef< any >
) {
	const navigatorBackButtonProps = useNavigatorBackButton( props );

	return <View ref={ forwardedRef } { ...navigatorBackButtonProps } />;
}

/**
 * The `Navigator.BackButton` component can be used to navigate to a screen and
 * should be used in combination with the `NavigatorProvider` (also aliased as `Navigator`),
 * the `Navigator.Screen` and the `Navigator.Button` components (or the `useNavigator`
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
 *       <Navigator.BackButton>
 *         Go back
 *       </Navigator.BackButton>
 *     </Navigator.Screen>
 *   </Navigator>
 * );
 * ```
 */
export const NavigatorBackButton = contextConnect(
	UnconnectedNavigatorBackButton,
	'Navigator.BackButton'
);

export default NavigatorBackButton;
