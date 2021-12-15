/**
 * External dependencies
 */
import type { Ref } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { useMemo, useState, useCallback } from '@wordpress/element';

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
import type {
	NavigatorProviderProps,
	NavigatorLocation,
	NavigatorContext as NavigatorContextType,
} from '../types';

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

	const [ locationHistory, setLocationHistory ] = useState<
		NavigatorLocation[]
	>( [
		{
			path: initialPath,
			isBack: false,
			isInitial: true,
		},
	] );

	const push: NavigatorContextType[ 'push' ] = useCallback(
		( path, options ) => {
			setLocationHistory( [
				...locationHistory.slice( 0, -1 ),
				{
					...locationHistory[ locationHistory.length - 1 ],
					isBack: false,
				},
				{
					...options,
					path,
					isBack: false,
					isInitial: false,
				},
			] );
		},
		[ locationHistory ]
	);

	const pop: NavigatorContextType[ 'pop' ] = useCallback( () => {
		if ( locationHistory.length > 1 ) {
			setLocationHistory( [
				...locationHistory.slice( 0, -2 ),
				// Force the `isBack` flag to `true` when navigating back.
				{
					...locationHistory[ locationHistory.length - 2 ],
					isBack: true,
				},
			] );
		}
	}, [ locationHistory ] );

	const navigatorContextValue: NavigatorContextType = {
		location: locationHistory[ locationHistory.length - 1 ],
		push,
		pop,
	};

	const cx = useCx();
	const classes = useMemo(
		// Prevents horizontal overflow while animating screen transitions
		() => cx( css( { overflowX: 'hidden' } ), className ),
		[ className ]
	);

	return (
		<View ref={ forwardedRef } className={ classes } { ...otherProps }>
			<NavigatorContext.Provider value={ navigatorContextValue }>
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
