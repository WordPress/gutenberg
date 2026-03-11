import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { ArrowProps } from './types';

/**
 * Renders an arrow element that points toward the popover anchor.
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
