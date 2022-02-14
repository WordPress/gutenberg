/**
 * External dependencies
 */
import type { Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { motion, MotionProps } from 'framer-motion';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import { useContext, useEffect, useMemo, useRef } from '@wordpress/element';
import {
	useReducedMotion,
	useMergeRefs,
	usePrevious,
} from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';
import { escapeAttribute } from '@wordpress/escape-html';

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
import type { NavigatorScreenProps } from '../types';

const animationEnterDelay = 0;
const animationEnterDuration = 0.14;
const animationExitDuration = 0.14;
const animationExitDelay = 0;

// Props specific to `framer-motion` can't be currently passed to `NavigatorScreen`,
// as some of them would overlap with HTML props (e.g. `onAnimationStart`, ...)
type Props = Omit<
	WordPressComponentProps< NavigatorScreenProps, 'div', false >,
	keyof MotionProps
>;

function NavigatorScreen( props: Props, forwardedRef: Ref< any > ) {
	const { children, className, path, ...otherProps } = useContextSystem(
		props,
		'NavigatorScreen'
	);

	const prefersReducedMotion = useReducedMotion();
	const { location } = useContext( NavigatorContext );
	const isMatch = location.path === escapeAttribute( path );
	const wrapperRef = useRef< HTMLDivElement >( null );

	const previousLocation = usePrevious( location );

	const cx = useCx();
	const classes = useMemo(
		() =>
			cx(
				css( {
					// Ensures horizontal overflow is visually accessible
					overflowX: 'auto',
					// In case the root has a height, it should not be exceeded
					maxHeight: '100%',
				} ),
				className
			),
		[ className, cx ]
	);

	// Focus restoration
	const isInitialLocation = location.isInitial && ! location.isBack;
	useEffect( () => {
		// Only attempt to restore focus:
		// - if the current location is not the initial one (to avoid moving focus on page load)
		// - when the screen becomes visible
		// - if the wrapper ref has been assigned
		if ( isInitialLocation || ! isMatch || ! wrapperRef.current ) {
			return;
		}

		let elementToFocus: HTMLElement | null = null;

		// When navigating back, if a selector is provided, use it to look for the
		// target element (assumed to be a node inside the current NavigatorScreen)
		if ( location.isBack && previousLocation?.focusTargetSelector ) {
			elementToFocus = wrapperRef.current.querySelector(
				previousLocation.focusTargetSelector
			);
		}

		// If the previous query didn't run or find any element to focus, fallback
		// to the first tabbable element in the screen (or the screen itself).
		if ( ! elementToFocus ) {
			const firstTabbable = ( focus.tabbable.find(
				wrapperRef.current
			) as HTMLElement[] )[ 0 ];

			elementToFocus = firstTabbable ?? wrapperRef.current;
		}

		elementToFocus.focus();
	}, [ isInitialLocation, isMatch ] );

	const mergedWrapperRef = useMergeRefs( [ forwardedRef, wrapperRef ] );

	if ( ! isMatch ) {
		return null;
	}

	if ( prefersReducedMotion ) {
		return (
			<View
				ref={ mergedWrapperRef }
				className={ classes }
				{ ...otherProps }
			>
				{ children }
			</View>
		);
	}

	const animate = {
		opacity: 1,
		transition: {
			delay: animationEnterDelay,
			duration: animationEnterDuration,
			ease: 'easeInOut',
		},
		x: 0,
	};
	const initial = {
		opacity: 0,
		x:
			( isRTL() && location.isBack ) || ( ! isRTL() && ! location.isBack )
				? 50
				: -50,
	};
	const exit = {
		delay: animationExitDelay,
		opacity: 0,
		x:
			( ! isRTL() && location.isBack ) || ( isRTL() && ! location.isBack )
				? 50
				: -50,
		transition: {
			duration: animationExitDuration,
			ease: 'easeInOut',
		},
	};

	const animatedProps = {
		animate,
		exit,
		initial,
	};

	return (
		<motion.div
			ref={ mergedWrapperRef }
			className={ classes }
			{ ...otherProps }
			{ ...animatedProps }
		>
			{ children }
		</motion.div>
	);
}

/**
 * The `NavigatorScreen` component represents a single view/screen/panel and
 * should be used in combination with the `NavigatorProvider`, the
 * `NavigatorLink` and the `NavigatorBackLink` components (or the `useNavigator`
 * hook).
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
 *        <NavigatorLink path="/child">
 *          Navigate to child screen.
 *       </NavigatorLink>
 *     </NavigatorScreen>
 *
 *     <NavigatorScreen path="/child">
 *       <p>This is the child screen.</p>
 *       <NavigatorBackLink>
 *         Go back
 *       </NavigatorBackLink>
 *     </NavigatorScreen>
 *   </NavigatorProvider>
 * );
 * ```
 */
const ConnectedNavigatorScreen = contextConnect(
	NavigatorScreen,
	'NavigatorScreen'
);

export default ConnectedNavigatorScreen;
