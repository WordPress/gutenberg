/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { motion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useContext } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { NavigatorContext } from './context';

const animationEnterDelay = 0;
const animationEnterDuration = 0.14;
const animationExitDuration = 0.14;
const animationExitDelay = 0;

function NavigatorScreen( { children, path } ) {
	const [ currentPath ] = useContext( NavigatorContext );
	const isMatch = currentPath.path === path;

	if ( isMatch ) {
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
			x: currentPath.isBack ? -50 : 50,
		};
		const exit = {
			delay: animationExitDelay,
			opacity: 0,
			x: currentPath.isBack ? 50 : -50,
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

		return <motion.div { ...animatedProps }>{ children }</motion.div>;
	}

	return null;
}

export default NavigatorScreen;
