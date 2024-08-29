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
			'wp.components.NavigatorScreen: the `path` should follow a URL-like scheme; it should start with and be separated by the `/` character.'
		);
	}

	// Generate a unique ID for the screen.
	const screenId = useId();

	// Refs
	const wrapperRef = useRef< HTMLDivElement >( null );
	const mergedWrapperRef = useMergeRefs( [ forwardedRef, wrapperRef ] );

	// Read props and components context.
	const { children, className, path, ...otherProps } = useContextSystem(
		props,
		'NavigatorScreen'
	);

	// Read navigator context, destructure location props.
	const { location, match, addScreen, removeScreen } =
		useContext( NavigatorContext );
	const { isInitial, isBack, focusTargetSelector, skipFocus } = location;

	// Locally computed state
	const isMatch = match === screenId;
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
	const { animationStyles, onScreenAnimationEnd, shouldRenderScreen } =
		useScreenAnimatePresence( {
			isMatch,
			isBack,
			skipAnimation: skipAnimationAndFocusRestoration,
		} );

	// Styles
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
		// Only attempt to restore focus:
		// - if the current location is not the initial one (to avoid moving focus on page load)
		// - when the screen becomes visible
		// - if the wrapper ref has been assigned
		// - if focus hasn't already been restored for the current location
		// - if the `skipFocus` option is not set to `true`. This is useful when we trigger the navigation outside of NavigatorScreen.
		if (
			skipAnimationAndFocusRestoration ||
			! isMatch ||
			! wrapperRef.current ||
			locationRef.current.hasRestoredFocus ||
			skipFocus
		) {
			return;
		}

		const activeElement = wrapperRef.current.ownerDocument.activeElement;

		// If an element is already focused within the wrapper do not focus the
		// element. This prevents inputs or buttons from losing focus unnecessarily.
		if ( wrapperRef.current.contains( activeElement ) ) {
			return;
		}

		let elementToFocus: HTMLElement | null = null;

		// When navigating back, if a selector is provided, use it to look for the
		// target element (assumed to be a node inside the current NavigatorScreen)
		if ( isBack && focusTargetSelector ) {
			elementToFocus =
				wrapperRef.current.querySelector( focusTargetSelector );
		}

		// If the previous query didn't run or find any element to focus, fallback
		// to the first tabbable element in the screen (or the screen itself).
		if ( ! elementToFocus ) {
			const [ firstTabbable ] = focus.tabbable.find( wrapperRef.current );
			elementToFocus = firstTabbable ?? wrapperRef.current;
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

	return shouldRenderScreen ? (
		<View
			ref={ mergedWrapperRef }
			className={ classes }
			onAnimationEnd={ onScreenAnimationEnd }
			{ ...otherProps }
		>
			{ children }
		</View>
	) : null;
}

/**
 * The `NavigatorScreen` component represents a single view/screen/panel and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorButton` and the `NavigatorBackButton` components (or the `useNavigator`
 * hook).
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
export const NavigatorScreen = contextConnect(
	UnconnectedNavigatorScreen,
	'NavigatorScreen'
);

export default NavigatorScreen;
