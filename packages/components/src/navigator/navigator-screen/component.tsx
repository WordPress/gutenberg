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
	useState,
	useLayoutEffect,
} from '@wordpress/element';
import { useMergeRefs, usePrevious } from '@wordpress/compose';
import { isRTL as isRTLFn } from '@wordpress/i18n';
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

const isReducedMotion = ( w: Window | null | undefined ) =>
	!! w && w.matchMedia( `(prefers-reduced-motion)` ).matches === true;

const isExitAnimation = ( e: AnimationEvent ) =>
	e.animationName === styles.slideToLeft.name || styles.slideToRight.name;

function UnconnectedNavigatorScreen(
	props: WordPressComponentProps< NavigatorScreenProps, 'div', false >,
	forwardedRef: ForwardedRef< any >
) {
	if ( ! /^\//.test( props.path ) ) {
		warning(
			'wp.components.NavigatorScreen: the `path` should follow a URL-like scheme; it should start with and be separated by the `/` character.'
		);
	}

	const screenId = useId();

	// Read props and components context.
	const { children, className, path, ...otherProps } = useContextSystem(
		props,
		'NavigatorScreen'
	);

	// Read navigator context, destructure location props.
	const { location, match, addScreen, removeScreen } =
		useContext( NavigatorContext );
	const { isInitial, isBack, focusTargetSelector, skipFocus } = location;

	// Determine if the screen is currently selected.
	const isMatch = match === screenId;
	const wasMatch = usePrevious( isMatch );

	const skipAnimationAndFocusRestoration = !! isInitial && ! isBack;

	const wrapperRef = useRef< HTMLDivElement >( null );

	// Possible values:
	// - idle: first value assigned to the screen when added to the React tree
	// - armed: will start an exit animation when deselected
	// - animating: the exit animation is happening
	// - animated: the exit animation has ended
	const [ exitAnimationStatus, setExitAnimationStatus ] = useState<
		'idle' | 'armed' | 'animating' | 'animated'
	>( 'idle' );

	useEffect( () => {
		const screen = {
			id: screenId,
			path: escapeAttribute( path ),
		};
		addScreen( screen );
		return () => removeScreen( screen );
	}, [ screenId, path, addScreen, removeScreen ] );

	// Update animation status.
	useLayoutEffect( () => {
		if ( ! wasMatch && isMatch ) {
			// When the screen becomes selected, set it to 'armed',
			// meaning that it will start an exit animation when deselected.
			setExitAnimationStatus( 'armed' );
		} else if ( wasMatch && ! isMatch ) {
			// When the screen becomes deselected, set it to:
			// - 'animating' (if animations are enabled)
			// - 'animated' (causing the animation to end and the screen to stop
			//    rendering its contents in the DOM, without the need to wait for
			//    the `animationend` event)
			setExitAnimationStatus(
				skipAnimationAndFocusRestoration ||
					isReducedMotion(
						wrapperRef.current?.ownerDocument?.defaultView
					)
					? 'animated'
					: 'animating'
			);
		}
	}, [ isMatch, wasMatch, skipAnimationAndFocusRestoration ] );

	// Styles
	const isRTL = isRTLFn();
	const cx = useCx();
	const animationDirection =
		( isRTL && isBack ) || ( ! isRTL && ! isBack )
			? 'forwards'
			: 'backwards';
	const isAnimatingOut =
		exitAnimationStatus === 'animating' ||
		exitAnimationStatus === 'animated';
	const classes = useMemo(
		() =>
			cx(
				styles.navigatorScreen( {
					skipInitialAnimation: skipAnimationAndFocusRestoration,
					direction: animationDirection,
					isAnimatingOut,
				} ),
				className
			),
		[
			className,
			cx,
			skipAnimationAndFocusRestoration,
			animationDirection,
			isAnimatingOut,
		]
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

	const mergedWrapperRef = useMergeRefs( [ forwardedRef, wrapperRef ] );

	// Remove the screen contents from the DOM only when it not selected
	// and its exit animation has ended.
	if (
		! isMatch &&
		( exitAnimationStatus === 'idle' || exitAnimationStatus === 'animated' )
	) {
		return null;
	}

	return (
		<View
			ref={ mergedWrapperRef }
			className={ classes }
			onAnimationEnd={ ( e: AnimationEvent ) => {
				if ( ! isMatch && isExitAnimation( e ) ) {
					// When the exit animation ends on an unselected screen, set the
					// status to 'animated' to remove the screen contents from the DOM.
					setExitAnimationStatus( 'animated' );
				}
			} }
			{ ...otherProps }
		>
			{ children }
		</View>
	);
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
