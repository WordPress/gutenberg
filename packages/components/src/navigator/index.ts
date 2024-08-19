/**
 * Internal dependencies
 */
import { Navigator as TopLevelNavigator } from './navigator/component';
import { NavigatorScreen } from './navigator-screen/component';
import { NavigatorButton } from './navigator-button/component';
import { NavigatorBackButton } from './navigator-back-button/component';
export { useNavigator } from './use-navigator';

/**
 * The `Navigator` component allows rendering nested views/panels/menus
 * (via the `Navigator.Screen` component) and navigate between these different
 * view (via the `Navigator.Button` and `Navigator.BackButton` components or the
 * `useNavigator` hook).
 *
 * @example
 * ```jsx
 * import { Navigator } from '@wordpress/components';
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
export const Navigator = Object.assign( TopLevelNavigator, {
	dislayName: 'Navigator',
	Screen: Object.assign( NavigatorScreen, {
		displayName: 'Navigator.Screen',
	} ),
	Button: Object.assign( NavigatorButton, {
		displayName: 'Navigator.Button',
	} ),
	/**
	 * The `Navigator.BackButton` component can be used to navigate to a screen and
	 * should be used in combination with the `Navigator`, the
	 * `Navigator.Screen` and the `Navigator.Button` components, and the `useNavigator`
	 * hook.
	 *
	 * @example
	 * ```jsx
	 * import { Navigator } from '@wordpress/components';
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
	BackButton: Object.assign( NavigatorBackButton, {
		displayName: 'Navigator.BackButton',
	} ),
} );
