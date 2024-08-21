/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { useMemo, useReducer } from '@wordpress/element';
import isShallowEqual from '@wordpress/is-shallow-equal';
import warning from '@wordpress/warning';

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
	NavigatorProps,
	NavigatorLocation,
	NavigatorContext as NavigatorContextType,
	NavigateOptions,
	Screen,
	NavigateToParentOptions,
} from '../types';
import deprecated from '@wordpress/deprecated';

type MatchedPath = ReturnType< typeof patternMatch >;

type RouterAction =
	| { type: 'add' | 'remove'; screen: Screen }
	| { type: 'goto'; path: string; options?: NavigateOptions }
	| { type: 'gotoparent'; options?: NavigateToParentOptions };

type RouterState = {
	initialPath: string;
	screens: Screen[];
	currentLocation: NavigatorLocation;
	matchedPath: MatchedPath;
	focusSelectors: Map< string, string >;
};

function addScreen( { screens }: RouterState, screen: Screen ) {
	if ( screens.some( ( s ) => s.path === screen.path ) ) {
		warning(
			`Navigator: a screen with path ${ screen.path } already exists.
The screen with id ${ screen.id } will not be added.`
		);
		return screens;
	}
	return [ ...screens, screen ];
}

function removeScreen( { screens }: RouterState, screen: Screen ) {
	return screens.filter( ( s ) => s.id !== screen.id );
}

function goTo(
	state: RouterState,
	path: string,
	options: NavigateOptions = {}
) {
	const { focusSelectors } = state;
	const currentLocation = { ...state.currentLocation };

	const {
		// Default assignments
		isBack = false,
		skipFocus = false,
		// Extract to avoid forwarding
		replace,
		focusTargetSelector,
		// Rest
		...restOptions
	} = options;

	if ( currentLocation.path === path ) {
		return { currentLocation, focusSelectors };
	}

	let focusSelectorsCopy: typeof focusSelectors | undefined;
	function getFocusSelectorsCopy() {
		focusSelectorsCopy =
			focusSelectorsCopy ?? new Map( state.focusSelectors );
		return focusSelectorsCopy;
	}

	// Set a focus selector that will be used when navigating
	// back to the current location.
	if ( focusTargetSelector && currentLocation.path ) {
		getFocusSelectorsCopy().set(
			currentLocation.path,
			focusTargetSelector
		);
	}

	// Get the focus selector for the new location.
	let currentFocusSelector;
	if ( focusSelectors.get( path ) ) {
		if ( isBack ) {
			// Use the found focus selector only when navigating back.
			currentFocusSelector = focusSelectors.get( path );
		}
		// Make a copy of the focusSelectors map to remove the focus selector
		// only if necessary (ie. a focus selector was found).
		getFocusSelectorsCopy().delete( path );
	}

	return {
		currentLocation: {
			...restOptions,
			isInitial: false,
			path,
			isBack,
			hasRestoredFocus: false,
			focusTargetSelector: currentFocusSelector,
			skipFocus,
		},
		focusSelectors: focusSelectorsCopy ?? focusSelectors,
	};
}

function goToParent(
	state: RouterState,
	options: NavigateToParentOptions = {}
) {
	const { screens, focusSelectors } = state;
	const currentLocation = { ...state.currentLocation };
	const currentPath = currentLocation.path;
	if ( currentPath === undefined ) {
		return { currentLocation, focusSelectors };
	}
	const parentPath = findParent( currentPath, screens );
	if ( parentPath === undefined ) {
		return { currentLocation, focusSelectors };
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
	let {
		screens,
		currentLocation,
		matchedPath,
		focusSelectors,
		...restState
	} = state;
	switch ( action.type ) {
		case 'add':
			screens = addScreen( state, action.screen );
			break;
		case 'remove':
			screens = removeScreen( state, action.screen );
			break;
		case 'goto':
			( { currentLocation, focusSelectors } = goTo(
				state,
				action.path,
				action.options
			) );
			break;
		case 'gotoparent':
			( { currentLocation, focusSelectors } = goToParent(
				state,
				action.options
			) );
			break;
	}

	// Return early in case there is no change
	if (
		screens === state.screens &&
		currentLocation === state.currentLocation
	) {
		return state;
	}

	// Compute the matchedPath
	const currentPath = currentLocation.path;
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

	return {
		...restState,
		screens,
		currentLocation,
		matchedPath,
		focusSelectors,
	};
}

function UnconnectedNavigator(
	props: WordPressComponentProps< NavigatorProps, 'div' >,
	forwardedRef: ForwardedRef< any >
) {
	const {
		initialPath: initialPathProp,
		children,
		className,
		...otherProps
	} = useContextSystem( props, 'Navigator' );

	const [ routerState, dispatch ] = useReducer(
		routerReducer,
		initialPathProp,
		( path ) => ( {
			screens: [],
			currentLocation: { path, isInitial: true },
			matchedPath: undefined,
			focusSelectors: new Map(),
			initialPath: initialPathProp,
		} )
	);

	// The methods are constant forever, create stable references to them.
	const methods = useMemo(
		() => ( {
			// Note: calling goBack calls `goToParent` internally, as it was established
			// that `goBack` should behave like `goToParent`, and `goToParent` should
			// be marked as deprecated.
			goBack: ( options: NavigateToParentOptions | undefined ) =>
				dispatch( { type: 'gotoparent', options } ),
			goTo: ( path: string, options?: NavigateOptions ) =>
				dispatch( { type: 'goto', path, options } ),
			goToParent: ( options: NavigateToParentOptions | undefined ) => {
				deprecated( `wp.components.useNavigator().goToParent`, {
					since: '6.7',
					alternative: 'wp.components.useNavigator().goBack',
				} );
				dispatch( { type: 'gotoparent', options } );
			},
			addScreen: ( screen: Screen ) =>
				dispatch( { type: 'add', screen } ),
			removeScreen: ( screen: Screen ) =>
				dispatch( { type: 'remove', screen } ),
		} ),
		[]
	);

	const { currentLocation, matchedPath } = routerState;

	const navigatorContextValue: NavigatorContextType = useMemo(
		() => ( {
			location: currentLocation,
			params: matchedPath?.params ?? {},
			match: matchedPath?.id,
			...methods,
		} ),
		[ currentLocation, matchedPath, methods ]
	);

	const cx = useCx();
	const classes = useMemo(
		() => cx( styles.navigatorWrapper, className ),
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

export const Navigator = contextConnect( UnconnectedNavigator, 'Navigator' );
