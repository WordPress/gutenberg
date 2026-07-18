import { NavigationMenu as _NavigationMenu } from '@base-ui/react/navigation-menu';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { BackdropProps } from './types';

/**
 * Renders an optional backdrop behind the navigation flyout.
 */
const Backdrop = forwardRef< HTMLDivElement, BackdropProps >(
	function NavigationMenuBackdrop( { className, ...props }, ref ) {
		return (
			<_NavigationMenu.Backdrop
				ref={ ref }
				className={ clsx( styles.backdrop, className ) }
				{ ...props }
			/>
		);
	}
);

export { Backdrop };
