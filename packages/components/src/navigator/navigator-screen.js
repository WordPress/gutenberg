/**
 * External dependencies
 */
import { motion } from 'framer-motion';

/**
 * WordPress dependencies
 */
import { createElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { contextConnect, useContextSystem } from '../ui/context';
import { Route } from './router';

function NavigatorScreen( props, forwardedRef ) {
	const {
		animationEnterDelay = 0,
		animationEnterDuration = 0.14,
		animationExitDelay = 0,
		animationExitDuration = 0.14,
		children,
		component,
		path,
		render,
		...otherProps
	} = useContextSystem( props, 'NavigatorScreen' );
	return (
		<Route
			{ ...otherProps }
			path={ path }
			ref={ forwardedRef }
			render={ ( routeProps ) => {
				const { history } = routeProps;
				const isBack =
					history?.action === 'POP' ||
					history?.location?.state?.isBack;

				const combinedProps = { ...routeProps, ...otherProps };

				/* eslint-disable no-nested-ternary */
				const content = children
					? typeof children === 'function'
						? children( combinedProps )
						: children
					: component
					? createElement( component, combinedProps )
					: render
					? render( combinedProps )
					: null;
				/* eslint-enable no-nested-ternary */

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
					x: isBack ? -50 : 50,
				};
				const exit = {
					delay: animationExitDelay,
					opacity: 0,
					x: isBack ? 50 : -50,
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
					<motion.div { ...animatedProps } key={ path }>
						{ content }
					</motion.div>
				);
			} }
		/>
	);
}

export default contextConnect( NavigatorScreen, 'NavigatorScreen' );
