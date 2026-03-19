import { Popover as _Popover } from '@base-ui/react/popover';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';
import type { BackdropProps } from './types';

/**
 * An overlay displayed beneath the popover. Typically used with `modal={true}`
 * to provide a visual signal that interaction with the rest of the page is
 * blocked.
 */
const Backdrop = forwardRef< HTMLDivElement, BackdropProps >(
	function PopoverBackdrop(
		{ className, variant = 'default', ...props },
		ref
	) {
		return (
			<_Popover.Backdrop
				ref={ ref }
				className={ clsx(
					styles.backdrop,
					variant === 'unstyled' && styles[ 'backdrop-unstyled' ],
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { Backdrop };
