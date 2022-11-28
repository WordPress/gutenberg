/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';
import { useNavigatorButton } from './hook';
import type { NavigatorButtonProps } from '../types';

function UnconnectedNavigatorButton(
	props: WordPressComponentProps< NavigatorButtonProps, 'button' >,
	forwardedRef: ForwardedRef< any >
) {
	const navigatorButtonProps = useNavigatorButton( props );

	return <View ref={ forwardedRef } { ...navigatorButtonProps } />;
}

/**
 * The `NavigatorButton` component can be used to navigate to a screen and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorContainer`, the `NavigatorScreen` and the `NavigatorBackButton`
 * components (or the `useNavigator` hook).
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalNavigatorProvider as NavigatorProvider,
 *   __experimentalNavigatorContainer as NavigatorContainer,
 *   __experimentalNavigatorScreen as NavigatorScreen,
 *   __experimentalNavigatorButton as NavigatorButton,
 *   __experimentalNavigatorBackButton as NavigatorBackButton,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <NavigatorProvider initialPath="/">
 *     <NavigatorContainer>
 *       <NavigatorScreen path="/">
 *         <p>This is the home screen.</p>
 *          <NavigatorButton path="/child">
 *            Navigate to child screen.
 *         </NavigatorButton>
 *       </NavigatorScreen>
 *
 *       <NavigatorScreen path="/child">
 *         <p>This is the child screen.</p>
 *         <NavigatorBackButton>
 *           Go back
 *         </NavigatorBackButton>
 *       </NavigatorScreen>
 *     </NavigatorContainer>
 *   </NavigatorProvider>
 * );
 * ```
 */
export const NavigatorButton = contextConnect(
	UnconnectedNavigatorButton,
	'NavigatorButton'
);

export default NavigatorButton;
