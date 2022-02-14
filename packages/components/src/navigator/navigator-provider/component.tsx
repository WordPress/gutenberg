/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
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
	forwardedRef: ForwardedRef< any >
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
		},
	] );

	const goTo: NavigatorContextType[ 'goTo' ] = useCallback(
		( path, options = {} ) => {
			setLocationHistory( [
				...locationHistory,
				{
					...options,
					path,
					isBack: false,
				},
			] );
		},
		[ locationHistory ]
	);

	const goBack: NavigatorContextType[ 'goBack' ] = useCallback( () => {
		if ( locationHistory.length > 1 ) {
			setLocationHistory( [
				...locationHistory.slice( 0, -2 ),
				{
					...locationHistory[ locationHistory.length - 2 ],
					isBack: true,
				},
			] );
		}
	}, [ locationHistory ] );

	const navigatorContextValue: NavigatorContextType = useMemo(
		() => ( {
			location: {
				...locationHistory[ locationHistory.length - 1 ],
				isInitial: locationHistory.length === 1,
			},
			goTo,
			goBack,
		} ),
		[ locationHistory, goTo, goBack ]
	);

	const cx = useCx();
	const classes = useMemo(
		// Prevents horizontal overflow while animating screen transitions
		() => cx( css( { overflowX: 'hidden' } ), className ),
		[ className, cx ]
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
 * The `NavigatorProvider` component allows rendering nested views/panels/menus
 * (via the `NavigatorScreen` component and navigate between these different
 * view (via the `NavigatorLink` and `NavigatorBackLink` components or the
 * `useNavigator` hook).
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
const ConnectedNavigatorProvider = contextConnect(
	NavigatorProvider,
	'NavigatorProvider'
);

export default ConnectedNavigatorProvider;
