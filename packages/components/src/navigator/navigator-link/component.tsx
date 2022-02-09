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
import { useNavigatorLink } from './hook';
import type { NavigatorLinkProps } from '../types';

function NavigatorLink(
	props: WordPressComponentProps< NavigatorLinkProps, 'button' >,
	forwardedRef: Ref< any >
) {
	const navigatorLinkProps = useNavigatorLink( props );

	return <View ref={ forwardedRef } { ...navigatorLinkProps } />;
}

/**
 * The `NavigatorLink` component can be used to navigate to a screen and should
 * be used in combination with the `NavigatorProvider`, the `NavigatorScreen`
 * and the `NavigatorBackLink` components (or the `useNavigator` hook).
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalNavigatorProvider as NavigatorProvider,
 *   __experimentalNavigatorScreen as NavigatorScreen,
 *   __experimentalNavigatorLink as NavigatorLink,
 *   __experimentalNavigatorBackLink as NavigatorBackLink,
 * } from '@wordpress/components';
 *
 * const MyNavigation = () => (
 *   <NavigatorProvider initialPath="/">
 *     <NavigatorScreen path="/">
 *       <p>This is the home screen.</p>
 *        <NavigatorLink variant="secondary" path="/child">
 *          Navigate to child screen.
 *       </NavigatorLink>
 *     </NavigatorScreen>
 *
 *     <NavigatorScreen path="/child">
 *       <p>This is the child screen.</p>
 *       <NavigatorBackLink variant="secondary">
 *         Go back
 *       </NavigatorBackLink>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
const ConnectedNavigatorLink = contextConnect( NavigatorLink, 'NavigatorLink' );

export default ConnectedNavigatorLink;
