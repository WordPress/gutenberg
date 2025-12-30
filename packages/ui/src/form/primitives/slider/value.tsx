import clsx from 'clsx';
import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import sliderStyles from '../../../utils/css/slider.module.css';
import type { SliderValueProps } from './types';

/**
 * Displays the current value of the slider as text.
 * Renders an output element for accessibility.
 */
export const Value = forwardRef< HTMLOutputElement, SliderValueProps >(
	function Value( { className, ...restProps }, ref ) {
		return (
			<_Slider.Value
				ref={ ref }
				className={ clsx( sliderStyles.value, className ) }
				{ ...restProps }
			/>
		);
	}
);
