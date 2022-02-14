/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { View } from '../../view';
import { useNavigatorButton } from './hook';
import type { NavigatorButtonProps } from '../types';

function NavigatorButton(
	props: WordPressComponentProps< NavigatorButtonProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const navigatorButtonProps = useNavigatorButton( props );

	return <View ref={ forwardedRef } { ...navigatorButtonProps } />;
}

/**
 * The `NavigatorButton` component can be used to navigate to a screen and should
 * be used in combination with the `NavigatorProvider`, the `NavigatorScreen`
 * and the `NavigatorBackButton` components (or the `useNavigator` hook).
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
const ConnectedNavigatorButton = contextConnect(
	NavigatorButton,
	'NavigatorButton'
);

export default ConnectedNavigatorButton;
