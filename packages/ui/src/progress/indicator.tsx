import { Progress as _Progress } from '@base-ui/react/progress';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { IndicatorProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * The filled portion of the track, or an animation for indeterminate progress.
 */
const Indicator = forwardRef< HTMLDivElement, IndicatorProps >(
	function ProgressIndicator( { color, className, style, ...props }, ref ) {
		return (
			<_Progress.Indicator
				ref={ ref }
				style={ color === undefined ? style : { ...style, color } }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.indicator,
					className
				) }
				{ ...props }
			/>
		);
	}
);

export { Indicator };
