/**
 * External dependencies
 */
// eslint-disable-next-line no-restricted-imports
import type { Ref } from 'react';
// eslint-disable-next-line no-restricted-imports
import { motion, MotionProps } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { useContext, useEffect, useState } from '@wordpress/element';
import { useReducedMotion, useFocusOnMount } from '@wordpress/compose';
import { isRTL } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import {
	contextConnect,
	useContextSystem,
	WordPressComponentProps,
} from '../../ui/context';
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
	const { children, path, ...otherProps } = useContextSystem(
		props,
		'NavigatorScreen'
	);

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
		return (
			<View ref={ forwardedRef } { ...otherProps }>
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
			{ ...otherProps }
			{ ...animatedProps }
		>
			{ children }
		</motion.div>
	);
}

// TODO: docs
const ConnectedNavigatorScreen = contextConnect(
	NavigatorScreen,
	'NavigatorScreen'
);

export default ConnectedNavigatorScreen;
