import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import type { SliderControlProps } from './types';

/**
 * The clickable, interactive part of the slider.
 * Contains the track and thumb elements.
 */
export const Control = forwardRef< HTMLDivElement, SliderControlProps >(
	function Control( props, ref ) {
		return <_Slider.Control ref={ ref } { ...props } />;
	}
);
