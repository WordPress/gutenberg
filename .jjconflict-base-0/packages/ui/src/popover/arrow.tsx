import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ArrowProps } from './types';

function DefaultArrowSvg( props: React.ComponentProps< 'svg' > ) {
	return (
		<svg
			width="20"
			height="10"
			viewBox="0 0 20 10"
			fill="none"
			{ ...props }
		>
			<path
				d="M20 10H0V8h1.465a4 4 0 0 0 2.676-1.027l5.19-4.388c.378-.341.96-.341 1.338 0l5.19 4.388A4 4 0 0 0 18.535 8H20z"
				className={ styles[ 'arrow-fill' ] }
			/>
			<path
				d="M10 3.097 4.81 7.486A5 5 0 0 1 1.465 8.77H0V8h1.465a4 4 0 0 0 2.676-1.027l5.19-4.388c.378-.341.96-.341 1.338 0l5.19 4.388A4 4 0 0 0 18.535 8H20v.77h-1.465a5 5 0 0 1-3.345-1.284z"
				className={ styles[ 'arrow-stroke' ] }
			/>
		</svg>
	);
}

/**
 * Renders an optional arrow element that points toward the anchor.
 *
 * Must be placed inside `Popover.Popup`. The arrow automatically rotates
 * to match the current placement side.
 */
const Arrow = forwardRef< HTMLDivElement, ArrowProps >( function PopoverArrow(
	{ children, className, ...props },
	ref
) {
	return (
		<_Popover.Arrow
			ref={ ref }
			className={ clsx( styles.arrow, className ) }
			{ ...props }
		>
			{ children ?? <DefaultArrowSvg /> }
		</_Popover.Arrow>
	);
} );

export { Arrow };
