import { Meter as _Meter } from '@base-ui/react/meter';
import clsx from 'clsx';
import { forwardRef } from '@wordpress/element';
import type { IndicatorProps } from './types';
import resetStyles from '../utils/css/resets.module.css';
import styles from './style.module.css';

/**
 * The filled portion of the track representing the measured value.
 */
export const Indicator = forwardRef< HTMLDivElement, IndicatorProps >(
	function MeterIndicator( { tone = 'neutral', className, ...props }, ref ) {
		return (
			<_Meter.Indicator
				ref={ ref }
				className={ clsx(
					resetStyles[ 'box-sizing' ],
					styles.indicator,
					styles[ `is-${ tone }` ],
					className
				) }
				{ ...props }
			/>
		);
	}
);
