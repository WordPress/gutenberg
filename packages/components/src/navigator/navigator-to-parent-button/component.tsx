/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
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
 * The `NavigatorToParentButton` component can be used to navigate to a screen and
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
 *   __experimentalNavigatorToParentButton as NavigatorToParentButton,
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
 *       <NavigatorToParentButton>
 *         Go to parent
 *       </NavigatorToParentButton>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
export const NavigatorToParentButton = contextConnect(
	UnconnectedNavigatorToParentButton,
	'NavigatorToParentButton'
);

export default NavigatorToParentButton;
