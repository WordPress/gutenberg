import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { SpinnerProps } from './types';
import styles from './style.module.css';

/**
 * A component used to notify users that their action is being processed.
 */
export const Spinner = forwardRef< SVGSVGElement, SpinnerProps >(
	function UnforwardedSpinner( { className, color, style, ...props }, ref ) {
		return (
			<svg
				className={ clsx( styles.spinner, className ) }
				style={ color === undefined ? style : { ...style, color } }
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				role="presentation"
				focusable="false"
				{ ...props }
				ref={ ref }
			>
				<path
					className={ styles.indicator }
					d="m 50 0 a 50 50 0 0 1 0 100"
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		);
	}
);
