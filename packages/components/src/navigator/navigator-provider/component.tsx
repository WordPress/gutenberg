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

function UnconnectedNavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { initialPath, children, className, ...otherProps } =
		useContextSystem( props, 'NavigatorProvider' );

	const [ locationHistory, setLocationHistory ] = useState<
		NavigatorLocation[]
	>( [
		{
			path: initialPath,
		},
	] );

	const goTo: NavigatorContextType[ 'goTo' ] = useCallback(
		( path, options = {} ) => {
			setLocationHistory( ( prevLocationHistory ) => [
				...prevLocationHistory,
				{
					...options,
					path,
					isBack: false,
					hasRestoredFocus: false,
				},
			] );
		},
		[]
	);

	const goBack: NavigatorContextType[ 'goBack' ] = useCallback( () => {
		setLocationHistory( ( prevLocationHistory ) => {
			if ( prevLocationHistory.length <= 1 ) {
				return prevLocationHistory;
			}
			return [
				...prevLocationHistory.slice( 0, -2 ),
				{
					...prevLocationHistory[ prevLocationHistory.length - 2 ],
					isBack: true,
					hasRestoredFocus: false,
				},
			];
		} );
	}, [] );

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
		// Prevents horizontal overflow while animating screen transitions.
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
export const NavigatorProvider = contextConnect(
	UnconnectedNavigatorProvider,
	'NavigatorProvider'
);

export default NavigatorProvider;
