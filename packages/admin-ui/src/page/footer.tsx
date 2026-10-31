import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

/**
 * A footer that anchors itself to the bottom of `Page`, spanning
 * edge-to-edge and staying stuck to the bottom of the viewport while the
 * page content scrolls.
 *
 * Must be used as a child of `Page`, with `hasPadding` set — the sticky
 * positioning and edge-to-edge span rely on the padded content wrapper that
 * `hasPadding` renders.
 */
export const Footer = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef< 'div' >
>( function PageFooter( { className, ...props }, ref ) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.footer, className ) }
			{ ...props }
		/>
	);
} );
