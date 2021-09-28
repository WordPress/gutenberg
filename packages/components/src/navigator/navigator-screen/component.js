/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import { motion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState } from '@wordpress/element';
import { useReducedMotion, useFocusOnMount } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import { NavigatorContext } from '../context';

const animationEnterDelay = 0;
const animationEnterDuration = 0.14;
const animationExitDuration = 0.14;
const animationExitDelay = 0;

function NavigatorScreen( { children, path } ) {
	const prefersReducedMotion = useReducedMotion();
	const [ currentPath ] = useContext( NavigatorContext );
	const isMatch = currentPath.path === path;
	const ref = useFocusOnMount();

	// This flag is used to only apply the focus on mount when the actual path changes.
	// It avoids the focus to happen on the first render.
	const [ hasPathChanged, setHasPathChanged ] = useState( false );
	useEffect( () => {
		setHasPathChanged( true );
	}, [ path ] );

	if ( ! isMatch ) {
		return null;
	}

	if ( prefersReducedMotion ) {
		return <div>{ children }</div>;
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
			( isRTL() && currentPath.isBack ) ||
			( ! isRTL() && ! currentPath.isBack )
				? 50
				: -50,
	};
	const exit = {
		delay: animationExitDelay,
		opacity: 0,
		x:
			( ! isRTL() && currentPath.isBack ) ||
			( isRTL() && ! currentPath.isBack )
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
			ref={ hasPathChanged ? ref : undefined }
			{ ...animatedProps }
		>
			{ children }
		</motion.div>
	);
}

export default NavigatorScreen;
