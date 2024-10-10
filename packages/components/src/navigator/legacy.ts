/**
 * Internal dependencies
 */
import { Navigator as InternalNavigator } from './navigator/component';
import { NavigatorScreen as InternalNavigatorScreen } from './navigator-screen/component';
import { NavigatorButton as InternalNavigatorButton } from './navigator-button/component';
import { NavigatorBackButton as InternalNavigatorBackButton } from './navigator-back-button/component';
import { NavigatorToParentButton as InternalNavigatorToParentButton } from './navigator-to-parent-button/component';
export { useNavigator } from './use-navigator';

/**
 * The `NavigatorProvider` component allows rendering nested views/panels/menus
 * (via the `NavigatorScreen` component and navigate between them
 * (via the `NavigatorButton` and `NavigatorBackButton` components).
 *
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
export const NavigatorProvider = Object.assign( InternalNavigator, {
	displayName: 'NavigatorProvider',
} );

/**
 * The `NavigatorScreen` component represents a single view/screen/panel and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorButton` and the `NavigatorBackButton` components.
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
export const NavigatorScreen = Object.assign( InternalNavigatorScreen, {
	displayName: 'NavigatorScreen',
} );

/**
 * The `NavigatorButton` component can be used to navigate to a screen and should
 * be used in combination with the `NavigatorProvider`, the `NavigatorScreen`
 * and the `NavigatorBackButton` components.
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
export const NavigatorButton = Object.assign( InternalNavigatorButton, {
	displayName: 'NavigatorButton',
} );

/**
 * The `NavigatorBackButton` component can be used to navigate to a screen and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorScreen` and the `NavigatorButton` components.
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
 *         Go back (to parent)
 *       </NavigatorBackButton>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
export const NavigatorBackButton = Object.assign( InternalNavigatorBackButton, {
	displayName: 'NavigatorBackButton',
} );

/**
 * _Note: this component is deprecated. Please use the `NavigatorBackButton`
 * component instead._
 *
 * @deprecated
 */
export const NavigatorToParentButton = Object.assign(
	InternalNavigatorToParentButton,
	{
		displayName: 'NavigatorToParentButton',
	}
);
