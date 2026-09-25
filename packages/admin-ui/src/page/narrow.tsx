import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

/**
 * A centered, width-constrained container for content that should not span
 * the full width of the page, such as a settings form.
 *
 * Must be used as a child of `Page`.
 */
export const Narrow = forwardRef<
	HTMLDivElement,
	React.ComponentPropsWithoutRef< 'div' >
>( function PageNarrow( { className, ...props }, ref ) {
	return (
		<div
			ref={ ref }
			className={ clsx( styles.narrow, className ) }
			{ ...props }
		/>
	);
} );
