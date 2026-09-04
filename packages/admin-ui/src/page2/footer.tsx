import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

/**
 * A footer that anchors itself to the bottom of `Page2`, spanning
 * edge-to-edge and staying stuck to the bottom of the viewport while the
 * page content scrolls.
 *
 * Must be used as a child of `Page2`.
 */
export const Footer = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef< 'div' >
>( function Page2Footer( { className, ...props }, ref ) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.footer, className ) }
			{ ...props }
		/>
	);
} );
