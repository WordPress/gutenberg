/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
import { useCx } from '../../utils/hooks/use-cx';
import { View } from '../../view';
import { NavigatorContext } from '../context';
import type { NavigatorProviderProps, NavigatorLocation } from '../types';

function NavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div' >,
	forwardedRef: Ref< any >
) {
	const {
		initialPath,
		children,
		className,
		...otherProps
	} = useContextSystem( props, 'NavigatorProvider' );

	const [ location, setLocation ] = useState< NavigatorLocation >( {
		path: initialPath,
	} );
	const [ isAnimating, setIsAnimating ] = useState< boolean >( false );

	const cx = useCx();
	const classes = useMemo(
		() => cx( isAnimating && css( { overflow: 'hidden' } ), className ),
		[ className, isAnimating ]
	);

	return (
		<View ref={ forwardedRef } className={ classes } { ...otherProps }>
			<NavigatorContext.Provider
				value={ {
					location,
					setLocation,
					isAnimating,
					setIsAnimating,
				} }
			>
				{ children }
			</NavigatorContext.Provider>
		</View>
	);
}

/**
 * The `NavigatorProvider` component allows rendering nested panels or menus (via the `NavigatorScreen` component) and navigate between these different states (via the `useNavigator` hook).
 * The Global Styles sidebar is an example of this. The `Navigator*` family of components is _not_ opinionated in terms of UI, and can be composed with any UI components to navigate between the nested screens.
 *
 * @example
 * ```jsx
 * import {
 *   __experimentalNavigatorProvider as NavigatorProvider,
 *   __experimentalNavigatorScreen as NavigatorScreen,
 *   __experimentalUseNavigator as useNavigator,
 * } from '@wordpress/components';
 *
 * function NavigatorButton( {
 *   path,
 *   isBack = false,
 *   ...props
 * } ) {
 *   const navigator = useNavigator();
 *   return (
 *   	<Button
 *   	  onClick={ () => navigator.push( path, { isBack } ) }
 *   	  { ...props }
 *   	/>
 *   );
 * }
 *
 * const MyNavigation = () => (
 *   <NavigatorProvider initialPath="/">
 *     <NavigatorScreen path="/">
 *       <p>This is the home screen.</p>
 *   	   <NavigatorButton isPrimary path="/child">
 *          Navigate to child screen.
 *       </NavigatorButton>
 *     </NavigatorScreen>
 *
 *     <NavigatorScreen path="/child">
 *       <p>This is the child screen.</p>
 *       <NavigatorButton isPrimary path="/" isBack>
 *         Go back
 *       </NavigatorButton>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
const ConnectedNavigatorProvider = contextConnect(
	NavigatorProvider,
	'NavigatorProvider'
);

export default ConnectedNavigatorProvider;
