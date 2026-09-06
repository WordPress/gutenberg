import clsx from 'clsx';
import type { ComponentProps } from 'react';
import { forwardRef } from '@wordpress/element';
import styles from './style.module.css';

/**
 * A component used to notify users that their action is being processed.
 */
export const Spinner = forwardRef< SVGSVGElement, ComponentProps< 'svg' > >(
	function Spinner( { className, ...props }, ref ) {
		return (
			<svg
				className={ clsx( styles.spinner, className ) }
				viewBox="0 0 100 100"
				xmlns="http://www.w3.org/2000/svg"
				role="presentation"
				focusable="false"
				{ ...props }
				ref={ ref }
			>
				<circle
					className={ styles.track }
					cx="50"
					cy="50"
					r="50"
					vectorEffect="non-scaling-stroke"
				/>
				<path
					className={ styles.indicator }
					d="m 50 0 a 50 50 0 0 1 50 50"
					vectorEffect="non-scaling-stroke"
				/>
			</svg>
		);
	}
);
