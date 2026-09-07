import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

/**
 * A container that breaks out of `Page2`'s inline padding to span
 * edge-to-edge. Useful for content such as a full-width table that should
 * align with the page's outer edges.
 *
 * Must be used as a child of `Page2`.
 */
export const FullBleed = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef< 'div' >
>( function Page2FullBleed( { className, ...props }, ref ) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles[ 'full-bleed' ], className ) }
			{ ...props }
		/>
	);
} );
