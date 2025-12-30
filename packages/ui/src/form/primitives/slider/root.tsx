import clsx from 'clsx';
import { Slider as _Slider } from '@base-ui/react/slider';
import { forwardRef } from '@wordpress/element';
import resetStyles from '../../../utils/css/resets.module.css';
import type { SliderRootProps } from './types';

/**
 * A low-level slider component that provides a range input
 * with accessible labeling support.
 *
 * The slider can be used standalone or prefer using a Field component
 * for accessible label association.
 */
export const Root = forwardRef< HTMLDivElement, SliderRootProps >(
	function Root( { className, ...restProps }, ref ) {
		return (
			<_Slider.Root
				ref={ ref }
				className={ clsx( resetStyles[ 'box-sizing' ], className ) }
				{ ...restProps }
			/>
		);
	}
);
