import clsx from 'clsx';
import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import sliderStyles from '../../../utils/css/slider.module.css';
import type { SliderIndicatorProps } from './types';

/**
 * Visualizes the current value of the slider.
 * Typically styled to show the filled portion of the track.
 */
export const Indicator = forwardRef< HTMLDivElement, SliderIndicatorProps >(
	function Indicator( { className, ...restProps }, ref ) {
		return (
			<_Slider.Indicator
				ref={ ref }
				className={ clsx( sliderStyles.indicator, className ) }
				{ ...restProps }
			/>
		);
	}
);
