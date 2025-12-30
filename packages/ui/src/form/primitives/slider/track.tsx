import clsx from 'clsx';
import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import sliderStyles from '../../../utils/css/slider.module.css';
import type { SliderTrackProps } from './types';

/**
 * Contains the slider indicator and represents the entire range of the slider.
 */
export const Track = forwardRef< HTMLDivElement, SliderTrackProps >(
	function Track( { className, ...restProps }, ref ) {
		return (
			<_Slider.Track
				ref={ ref }
				className={ clsx( sliderStyles.track, className ) }
				{ ...restProps }
			/>
		);
	}
);
