/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import {
	useMemo,
	useState,
	useCallback,
	useReducer,
	useRef,
	useEffect,
} from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import { View } from '../../view';
import { NavigatorContext } from '../context';
import type {
	NavigatorProviderProps,
	NavigatorLocation,
	NavigatorContext as NavigatorContextType,
	Screen,
} from '../types';
import { patternMatch, findParent } from '../utils/router';
import { useControlledValue } from '../../utils';

type MatchedPath = ReturnType< typeof patternMatch >;
type ScreenAction = { type: string; screen: Screen };

const MAX_HISTORY_LENGTH = 50;

function screensReducer(
	state: Screen[] = [],
	action: ScreenAction
): Screen[] {
	switch ( action.type ) {
		case 'add':
			return [ ...state, action.screen ];
		case 'remove':
			return state.filter( ( s: Screen ) => s.id !== action.screen.id );
	}

	return state;
}

function UnconnectedNavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		initialPath,
		location: locationProp,
		onChange,
		children,
		className,
		...otherProps
	} = useContextSystem( props, 'NavigatorProvider' );
	const [ location, updatedLocation ] = useControlledValue( {
		onChange,
		value: locationProp,
		defaultValue: { path: initialPath },
	} );

	const [ locationHistory, setLocationHistory ] = useState<
		NavigatorLocation[]
	>( [ location ?? { path: initialPath } ] );
	const currentLocationHistory = useRef< NavigatorLocation[] >( [] );
	const [ screens, dispatch ] = useReducer( screensReducer, [] );
	const currentScreens = useRef< Screen[] >( [] );
	useEffect( () => {
		currentScreens.current = screens;
	}, [ screens ] );
	useEffect( () => {
		currentLocationHistory.current = locationHistory;
	}, [ locationHistory ] );
	useEffect( () => {
		if ( ! location ) {
			return;
		}

		const {
			focusTargetSelector,
			isBack = false,
			skipFocus = false,
			replace = false,
			path: destinationPath,
			...restOptions
		} = location;

		const isNavigatingToPreviousPath =
			isBack &&
			currentLocationHistory.current.length > 1 &&
			currentLocationHistory.current[
				currentLocationHistory.current.length - 2
			].path === destinationPath;

		if ( isNavigatingToPreviousPath ) {
			setLocationHistory( ( prevLocationHistory ) => {
				if ( prevLocationHistory.length <= 1 ) {
					return prevLocationHistory;
				}
				return [
					...prevLocationHistory.slice( 0, -2 ),
					{
						...prevLocationHistory[
							prevLocationHistory.length - 2
						],
						isBack: true,
						hasRestoredFocus: false,
					},
				];
			} );
			return;
		}

		setLocationHistory( ( prevLocationHistory ) => {
			const newLocation = {
				...restOptions,
				path: destinationPath,
				isBack,
				hasRestoredFocus: false,
				skipFocus,
			};

			if ( prevLocationHistory.length === 0 ) {
				return replace ? [] : [ newLocation ];
			}

			// Form the new location history array.
			// Start by picking all previous history items, apart from the last one.
			// A check is in place to make sure that the array doesn't grow
			// beyond a max length.
			const newLocationHistory = prevLocationHistory.slice(
				prevLocationHistory.length > MAX_HISTORY_LENGTH - 1 ? 1 : 0,
				-1
			);

			// If we're not replacing history, add the last location history item (the
			// one what was just navigated from). We also assign it a
			// `focusTargetSelector` for enhanced focus restoration when navigating
			// back to it.
			if ( ! replace ) {
				newLocationHistory.push( {
					...prevLocationHistory[ prevLocationHistory.length - 1 ],
					focusTargetSelector,
				} );
			}

			// In any case, append the new location to the array (the one that
			// was just navigated to)
			newLocationHistory.push( newLocation );

			return newLocationHistory;
		} );
	}, [ location ] );

	const currentMatch = useRef< MatchedPath >();
	const matchedPath = useMemo( () => {
		let currentPath: string | undefined;
		if (
			locationHistory.length === 0 ||
			( currentPath =
				locationHistory[ locationHistory.length - 1 ].path ) ===
				undefined
		) {
			currentMatch.current = undefined;
			return undefined;
		}

		const resolvePath = ( pathToResolve: string ) => {
			const newMatch = patternMatch( pathToResolve, screens );

			// If the new match is the same as the current match,
			// return the previous one for performance reasons.
			if (
				currentMatch.current &&
				newMatch &&
				isShallowEqual(
					newMatch.params,
					currentMatch.current.params
				) &&
				newMatch.id === currentMatch.current.id
			) {
				return currentMatch.current;
			}

			return newMatch;
		};

		const newMatch = resolvePath( currentPath );
		currentMatch.current = newMatch;
		return newMatch;
	}, [ screens, locationHistory ] );

	const addScreen = useCallback(
		( screen: Screen ) => dispatch( { type: 'add', screen } ),
		[]
	);

	const removeScreen = useCallback(
		( screen: Screen ) => dispatch( { type: 'remove', screen } ),
		[]
	);

	const goBack: NavigatorContextType[ 'goBack' ] = useCallback( () => {
		if ( currentLocationHistory.current.length < 2 ) {
			return;
		}

		updatedLocation( {
			isBack: true,
			path: currentLocationHistory.current[
				currentLocationHistory.current.length - 2
			].path,
		} );
	}, [ updatedLocation ] );

	const goTo: NavigatorContextType[ 'goTo' ] = useCallback(
		( destinationPath, options = {} ) => {
			updatedLocation( {
				...options,
				path: destinationPath,
			} );
		},
		[ updatedLocation ]
	);

	const goToParent: NavigatorContextType[ 'goToParent' ] = useCallback(
		( options = {} ) => {
			const currentPath =
				currentLocationHistory.current[
					currentLocationHistory.current.length - 1
				].path;
			if ( currentPath === undefined ) {
				return;
			}
			const parentPath = findParent(
				currentPath,
				currentScreens.current
			);
			if ( parentPath === undefined ) {
				return;
			}
			goTo( parentPath, { ...options, isBack: true } );
		},
		[ goTo ]
	);

	const navigatorContextValue: NavigatorContextType = useMemo(
		() => ( {
			location: {
				...locationHistory[ locationHistory.length - 1 ],
				isInitial: locationHistory.length === 1,
			},
			params: matchedPath ? matchedPath.params : {},
			match: matchedPath ? matchedPath.id : undefined,
			goTo,
			goBack,
			goToParent,
			addScreen,
			removeScreen,
		} ),
		[
			locationHistory,
			matchedPath,
			goTo,
			goBack,
			goToParent,
			addScreen,
			removeScreen,
		]
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
