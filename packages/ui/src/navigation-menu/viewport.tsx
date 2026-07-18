import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';
import type { ViewportProps } from './types';

/**
 * Clips and sizes the currently active flyout Content.
 */
const Viewport = forwardRef< HTMLDivElement, ViewportProps >(
	function NavigationMenuViewport( { className, ...props }, ref ) {
		return (
			<_NavigationMenu.Viewport
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.viewport,
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { Viewport };
