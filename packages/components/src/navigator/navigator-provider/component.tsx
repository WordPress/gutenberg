/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useReducer } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import { patternMatch, findParent } from '../utils/router';
import { View } from '../../view';
import { NavigatorContext } from '../context';
import * as styles from '../styles';
import type {
	NavigatorProviderProps,
	NavigatorLocation,
	NavigatorContext as NavigatorContextType,
	NavigateOptions,
	Screen,
	NavigateToParentOptions,
} from '../types';

type MatchedPath = ReturnType< typeof patternMatch >;

type RouterAction =
	| { type: 'add' | 'remove'; screen: Screen }
	| { type: 'goback' }
	| { type: 'goto'; path: string; options?: NavigateOptions }
	| { type: 'gotoparent'; options?: NavigateToParentOptions };

type RouterState = {
	screens: Screen[];
	locationHistory: NavigatorLocation[];
	matchedPath: MatchedPath;
};

const MAX_HISTORY_LENGTH = 50;

function addScreen( { screens }: RouterState, screen: Screen ) {
	return [ ...screens, screen ];
}

function removeScreen( { screens }: RouterState, screen: Screen ) {
	return screens.filter( ( s ) => s.id !== screen.id );
}

function goBack( { locationHistory }: RouterState ) {
	if ( locationHistory.length <= 1 ) {
		return locationHistory;
	}
	return [
		...locationHistory.slice( 0, -2 ),
		{
			...locationHistory[ locationHistory.length - 2 ],
			isBack: true,
			hasRestoredFocus: false,
		},
	];
}

function goTo(
	state: RouterState,
	path: string,
	options: NavigateOptions = {}
) {
	const { locationHistory } = state;
	const {
		focusTargetSelector,
		isBack = false,
		skipFocus = false,
		replace = false,
		...restOptions
	} = options;

	const isNavigatingToSamePath =
		locationHistory.length > 0 &&
		locationHistory[ locationHistory.length - 1 ].path === path;
	if ( isNavigatingToSamePath ) {
		return locationHistory;
	}

	const isNavigatingToPreviousPath =
		isBack &&
		locationHistory.length > 1 &&
		locationHistory[ locationHistory.length - 2 ].path === path;

	if ( isNavigatingToPreviousPath ) {
		return goBack( state );
	}

	const newLocation = {
		...restOptions,
		path,
		isBack,
		hasRestoredFocus: false,
		skipFocus,
	};

	if ( locationHistory.length === 0 ) {
		return replace ? [] : [ newLocation ];
	}

	const newLocationHistory = locationHistory.slice(
		locationHistory.length > MAX_HISTORY_LENGTH - 1 ? 1 : 0,
		-1
	);

	if ( ! replace ) {
		newLocationHistory.push(
			// Assign `focusTargetSelector` to the previous location in history
			// (the one we just navigated from).
			{
				...locationHistory[ locationHistory.length - 1 ],
				focusTargetSelector,
			}
		);
	}

	newLocationHistory.push( newLocation );

	return newLocationHistory;
}

function goToParent(
	state: RouterState,
	options: NavigateToParentOptions = {}
) {
	const { locationHistory, screens } = state;
	const currentPath = locationHistory[ locationHistory.length - 1 ].path;
	if ( currentPath === undefined ) {
		return locationHistory;
	}
	const parentPath = findParent( currentPath, screens );
	if ( parentPath === undefined ) {
		return locationHistory;
	}
	return goTo( state, parentPath, {
		...options,
		isBack: true,
	} );
}

function routerReducer(
	state: RouterState,
	action: RouterAction
): RouterState {
	let { screens, locationHistory, matchedPath } = state;
	switch ( action.type ) {
		case 'add':
			screens = addScreen( state, action.screen );
			break;
		case 'remove':
			screens = removeScreen( state, action.screen );
			break;
		case 'goback':
			locationHistory = goBack( state );
			break;
		case 'goto':
			locationHistory = goTo( state, action.path, action.options );
			break;
		case 'gotoparent':
			locationHistory = goToParent( state, action.options );
			break;
	}

	// Return early in case there is no change
	if (
		screens === state.screens &&
		locationHistory === state.locationHistory
	) {
		return state;
	}

	// Compute the matchedPath
	const currentPath =
		locationHistory.length > 0
			? locationHistory[ locationHistory.length - 1 ].path
			: undefined;
	matchedPath =
		currentPath !== undefined
			? patternMatch( currentPath, screens )
			: undefined;

	// If the new match is the same as the previous match,
	// return the previous one to keep immutability.
	if (
		matchedPath &&
		state.matchedPath &&
		matchedPath.id === state.matchedPath.id &&
		isShallowEqual( matchedPath.params, state.matchedPath.params )
	) {
		matchedPath = state.matchedPath;
	}

	return { screens, locationHistory, matchedPath };
}

function UnconnectedNavigatorProvider(
	props: WordPressComponentProps< NavigatorProviderProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const { initialPath, children, className, ...otherProps } =
		useContextSystem( props, 'NavigatorProvider' );

	const [ routerState, dispatch ] = useReducer(
		routerReducer,
		initialPath,
		( path ) => ( {
			screens: [],
			locationHistory: [ { path } ],
			matchedPath: undefined,
		} )
	);

	// The methods are constant forever, create stable references to them.
	const methods = useMemo(
		() => ( {
			goBack: () => dispatch( { type: 'goback' } ),
			goTo: ( path: string, options?: NavigateOptions ) =>
				dispatch( { type: 'goto', path, options } ),
			goToParent: ( options: NavigateToParentOptions | undefined ) =>
				dispatch( { type: 'gotoparent', options } ),
			addScreen: ( screen: Screen ) =>
				dispatch( { type: 'add', screen } ),
			removeScreen: ( screen: Screen ) =>
				dispatch( { type: 'remove', screen } ),
		} ),
		[]
	);

	const { locationHistory, matchedPath } = routerState;

	const navigatorContextValue: NavigatorContextType = useMemo(
		() => ( {
			location: {
				...locationHistory[ locationHistory.length - 1 ],
				isInitial: locationHistory.length === 1,
			},
			params: matchedPath?.params ?? {},
			match: matchedPath?.id,
			...methods,
		} ),
		[ locationHistory, matchedPath, methods ]
	);

	const cx = useCx();
	const classes = useMemo(
		() => cx( styles.navigatorProviderWrapper, className ),
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
