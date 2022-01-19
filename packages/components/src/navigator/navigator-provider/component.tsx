/**
 * External dependencies
 */
import type { Ref } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo, useState } from '@wordpress/element';

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
import type { NavigatorProviderProps, NavigatorPath } from '../types';

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

	const [ path, setPath ] = useState< NavigatorPath >( {
		path: initialPath,
	} );

	const cx = useCx();
	const classes = useMemo(
		// Prevents horizontal overflow while animating screen transitions
		() => cx( css( { overflowX: 'hidden' } ), className ),
		[ className ]
	);

	return (
		<View ref={ forwardedRef } className={ classes } { ...otherProps }>
			<NavigatorContext.Provider value={ [ path, setPath ] }>
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
