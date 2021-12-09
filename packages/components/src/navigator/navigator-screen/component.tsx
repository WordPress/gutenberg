/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { motion, MotionProps } from 'framer-motion';
import { css } from '@emotion/react';

/**
 * WordPress dependencies
 */
import { focus } from '@wordpress/dom';
import {
	useContext,
	useEffect,
	useMemo,
	useState,
	useRef,
} from '@wordpress/element';
import { useReducedMotion } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

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
	const isMatch = location.path === path;
	const wrapperRef = useRef< HTMLDivElement >( null );

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
		[ className ]
	);

	// Focus restoration
	const [ isFirstRender, setIsFirstRender ] = useState( true );
	useEffect( () => {
		// Only attempt to restore focus:
		// - after the first render (to avoid moving focus on page load)
		// - when the screen becomes visible
		// - the wrapper ref has been assigned
		if ( isFirstRender || ! isMatch || ! wrapperRef.current ) {
			setIsFirstRender( false );
			return;
		}

		let elementToFocus: HTMLElement | null = null;

		// When navigating back, if a selector is provided, use it to look for the
		// target element (assumed to be a node inside the current NavigatorScreen)
		if ( location.isBack && location.focusRestorationSelector ) {
			elementToFocus = wrapperRef.current.querySelector(
				location.focusRestorationSelector
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
	}, [ isFirstRender, isMatch ] );

	if ( ! isMatch ) {
		return null;
	}

	if ( prefersReducedMotion ) {
		return (
			<View ref={ forwardedRef } className={ classes } { ...otherProps }>
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
			ref={ wrapperRef }
			className={ classes }
			{ ...otherProps }
			{ ...animatedProps }
		>
			{ children }
		</motion.div>
	);
}

/**
 * The `NavigatorScreen` component represents a single view/screen/panel/menu and is supposed to be used in combination with the `NavigatorProvider` component.
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
const ConnectedNavigatorScreen = contextConnect(
	NavigatorScreen,
	'NavigatorScreen'
);

export default ConnectedNavigatorScreen;
