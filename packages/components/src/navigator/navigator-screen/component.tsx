/**
 * External dependencies
 */
import type { ForwardedRef } from 'react';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import {
	useContext,
	useEffect,
	useMemo,
	useRef,
	useId,
} from '@wordpress/element';
import { useMergeRefs } from '@wordpress/compose';
import { escapeAttribute } from '@wordpress/escape-html';
import warning from '@wordpress/warning';

/**
 * Internal dependencies
 */
import type { WordPressComponentProps } from '../../context';
import { contextConnect, useContextSystem } from '../../context';
import { useCx } from '../../utils/hooks/use-cx';
import { View } from '../../view';
import { NavigatorContext } from '../context';
import * as styles from '../styles';
import type { NavigatorScreenProps } from '../types';
import { useScreenAnimatePresence } from './use-screen-animate-presence';

function UnconnectedNavigatorScreen(
	props: WordPressComponentProps< NavigatorScreenProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	if ( ! /^\//.test( props.path ) ) {
		warning(
			'wp.components.Navigator.Screen: the `path` should follow a URL-like scheme; it should start with and be separated by the `/` character.'
		);
	}

	const screenId = useId();

	const {
		children,
		className,
		path,
		onAnimationEnd: onAnimationEndProp,
		...otherProps
	} = useContextSystem( props, 'Navigator.Screen' );

	const { location, match, addScreen, removeScreen } =
		useContext( NavigatorContext );
	const { isInitial, isBack, focusTargetSelector, skipFocus } = location;

	const isMatch = match === screenId;
	const wrapperRef = useRef< HTMLDivElement >( null );
	const skipAnimationAndFocusRestoration = !! isInitial && ! isBack;

	// Register / unregister screen with the navigator context.
	useEffect( () => {
		const screen = {
			id: screenId,
			path: escapeAttribute( path ),
		};
		addScreen( screen );
		return () => removeScreen( screen );
	}, [ screenId, path, addScreen, removeScreen ] );

	// Animation.
	const { animationStyles, shouldRenderScreen, screenProps } =
		useScreenAnimatePresence( {
			isMatch,
			isBack,
			onAnimationEnd: onAnimationEndProp,
			skipAnimation: skipAnimationAndFocusRestoration,
		} );

	const cx = useCx();
	const classes = useMemo(
		() => cx( styles.navigatorScreen, animationStyles, className ),
		[ className, cx, animationStyles ]
	);

	// Focus restoration
	const locationRef = useRef( location );
	useEffect( () => {
		locationRef.current = location;
	}, [ location ] );
	useEffect( () => {
		const wrapperEl = wrapperRef.current;
		// Only attempt to restore focus:
		// - if the current location is not the initial one (to avoid moving focus on page load)
		// - when the screen becomes visible
		// - if the wrapper ref has been assigned
		// - if focus hasn't already been restored for the current location
		// - if the `skipFocus` option is not set to `true`. This is useful when we trigger the navigation outside of NavigatorScreen.
		if (
			skipAnimationAndFocusRestoration ||
			! isMatch ||
			! wrapperEl ||
			locationRef.current.hasRestoredFocus ||
			skipFocus
		) {
			return;
		}

		const activeElement = wrapperEl.ownerDocument.activeElement;

		// If an element is already focused within the wrapper do not focus the
		// element. This prevents inputs or buttons from losing focus unnecessarily.
		if ( wrapperEl.contains( activeElement ) ) {
			return;
		}

		let elementToFocus: HTMLElement | null = null;

		// When navigating back, if a selector is provided, use it to look for the
		// target element (assumed to be a node inside the current NavigatorScreen)
		if ( isBack && focusTargetSelector ) {
			elementToFocus = wrapperEl.querySelector( focusTargetSelector );
		}

		// If the previous query didn't run or find any element to focus, fallback
		// to the first tabbable element in the screen (or the screen itself).
		if ( ! elementToFocus ) {
			const [ firstTabbable ] = focus.tabbable.find( wrapperEl );
			elementToFocus = firstTabbable ?? wrapperEl;
		}

		locationRef.current.hasRestoredFocus = true;
		elementToFocus.focus();
	}, [
		skipAnimationAndFocusRestoration,
		isMatch,
		isBack,
		focusTargetSelector,
		skipFocus,
	] );

	const mergedWrapperRef = useMergeRefs( [ forwardedRef, wrapperRef ] );

	return shouldRenderScreen ? (
		<View
			ref={ mergedWrapperRef }
			className={ classes }
			{ ...screenProps }
			{ ...otherProps }
		>
			{ children }
		</View>
	) : null;
}

export const NavigatorScreen = contextConnect(
	UnconnectedNavigatorScreen,
	'Navigator.Screen'
);
