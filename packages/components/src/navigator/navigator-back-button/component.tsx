/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect } from '../../context';
import { useNavigatorBackButton } from './hook';
import type { NavigatorBackButtonProps } from '../types';
import Button from '../../button';

function UnconnectedNavigatorBackButton(
	props: WordPressComponentProps< NavigatorBackButtonProps, 'button', false >,
	forwardedRef: ForwardedRef< any >
) {
	const navigatorBackButtonProps = useNavigatorBackButton( props );

	return <Button ref={ forwardedRef } { ...navigatorBackButtonProps } />;
}

/**
 * The `NavigatorBackButton` component can be used to navigate to a screen and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorScreen` and the `NavigatorButton` components (or the `useNavigator`
 * hook).
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalNavigatorProvider as NavigatorProvider,
 *   __experimentalNavigatorScreen as NavigatorScreen,
 *   __experimentalNavigatorButton as NavigatorButton,
 *   __experimentalNavigatorBackButton as NavigatorBackButton,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <NavigatorProvider initialPath="/">
 *     <NavigatorScreen path="/">
 *       <p>This is the home screen.</p>
 *        <NavigatorButton path="/child">
 *          Navigate to child screen.
 *       </NavigatorButton>
 *     </NavigatorScreen>
 *
 *     <NavigatorScreen path="/child">
 *       <p>This is the child screen.</p>
 *       <NavigatorBackButton>
 *         Go back
 *       </NavigatorBackButton>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
export const NavigatorBackButton = contextConnect(
	UnconnectedNavigatorBackButton,
	'NavigatorBackButton'
);

export default NavigatorBackButton;
