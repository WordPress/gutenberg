/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { View } from '../../view';
import { ThemeContext } from '../context';
import type {
	ThemeProviderProps,
	ThemeProps as ThemeContextType, //Note to self: the shape of ThemeProps and ThemeContext is the same. If that changes, import the Context here, not the Props.
} from '../types';

function UnconnectedThemeProvider(
	props: WordPressComponentProps< ThemeProviderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { accent, children } = useContextSystem( props, 'ThemeProvider' );

	const themeContextValue: ThemeContextType = useMemo(
		() => ( { accent } ),
		[ accent ]
	);

	return (
		<View ref={ forwardedRef }>
			<ThemeContext.Provider value={ themeContextValue }>
				{ children }
			</ThemeContext.Provider>
		</View>
	);
}

/**
 * The `NavigatorProvider` component allows rendering nested views/panels/menus
 * (via the `NavigatorScreen` component and navigate between these different
 * view (via the `NavigatorButton` and `NavigatorBackButton` components or the
 * `useNavigator` hook).
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
export const ThemeProvider = contextConnect(
	UnconnectedThemeProvider,
	'ThemeProvider'
);

export default ThemeProvider;
