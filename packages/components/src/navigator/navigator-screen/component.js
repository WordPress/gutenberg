/**
 * WordPress dependencies
 */
import { useContext, useEffect, useRef } from '@wordpress/element';
import { useReducedMotion, useFocusOnMount } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	__unstableAnimatePresence as AnimatePresence,
	__unstableMotion as motion,
} from '../../animation';
import { NavigatorContext } from '../context';

const motionXVector = isRTL() ? -50 : 50;
const motionEase = [ 0, 0, 0.2, 1 ];
const motionEnterDelay = 0;
const motionEnterDuration = 0.14;
const motionExitDuration = 0.14;
const motionExitDelay = 0;

function NavigatorScreen( { children, path } ) {
	const prefersReducedMotion = useReducedMotion();
	const [ currentPath ] = useContext( NavigatorContext );
	const isMatch = currentPath.path === path;
	const ref = useFocusOnMount();

	// Denotes the initial screen.
	const isInitial = useRef( isMatch );
	// Sets isInitial ref to false once the screen has changed.
	useEffect( () => () => ( isInitial.current = false ), [
		isInitial.current && isMatch,
	] );

	const motionProps = {};
	if ( ! prefersReducedMotion ) {
		const x = currentPath.isBack ? -motionXVector : motionXVector;
		// Initial is false for first render
		motionProps.initial = ! isInitial.current && {
			x,
			opacity: 0,
		};
		motionProps.animate = {
			x: 0,
			opacity: 1,
			transition: {
				delay: motionEnterDelay,
				duration: motionEnterDuration,
				ease: motionEase,
			},
		};
		motionProps.exit = {
			x: isInitial.current ? -x : x,
			opacity: 0,
			transition: {
				delay: motionExitDelay,
				duration: motionExitDuration,
				ease: motionEase,
			},
		};
	}

	return (
		<AnimatePresence>
			{ isMatch ? (
				<motion.div
					ref={ ! isInitial.current ? ref : undefined }
					{ ...motionProps }
				>
					{ children }
				</motion.div>
			) : null }
		</AnimatePresence>
	);
}

export default NavigatorScreen;
