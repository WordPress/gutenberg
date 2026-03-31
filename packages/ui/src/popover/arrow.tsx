import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ArrowProps } from './types';

/**
 * Renders an optional arrow element that points toward the anchor.
 *
 * Must be placed inside `Popover.Popup`. The arrow automatically rotates
 * to match the current placement side.
 */
const Arrow = forwardRef< HTMLDivElement, ArrowProps >( function PopoverArrow(
	{ className, ...props },
	ref
) {
	return (
		<_Popover.Arrow
			ref={ ref }
			className={ clsx( styles.arrow, className ) }
			{ ...props }
		/>
	);
} );

export { Arrow };
