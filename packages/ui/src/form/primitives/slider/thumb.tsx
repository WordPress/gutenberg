import clsx from 'clsx';
import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import sliderStyles from '../../../utils/css/slider.module.css';
import type { SliderThumbProps } from './types';

/**
 * The draggable part of the slider at the tip of the indicator.
 * Renders a div element with a nested hidden range input for accessibility.
 */
export const Thumb = forwardRef< HTMLDivElement, SliderThumbProps >(
	function Thumb( { className, ...restProps }, ref ) {
		return (
			<_Slider.Thumb
				ref={ ref }
				className={ clsx( sliderStyles.thumb, className ) }
				{ ...restProps }
			/>
		);
	}
);
