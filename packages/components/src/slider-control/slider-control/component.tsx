/**
 * WordPress dependencies
 */
import { useInstanceId, useMergeRefs } from '@wordpress/compose';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import BaseControl from '../../base-control';
import Marks from '../marks/component';
import Slider from '../slider/component';
import Tooltip from '../tooltip/component';
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useSliderControl } from './hook';
import { VStack } from '../../v-stack';
import { clamp } from '../../utils/math';

import type { SliderControlProps } from '../types';

const noop = () => {};

const UnconnectedSliderControl = (
	props: WordPressComponentProps< SliderControlProps, 'input', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const {
		className,
		disabled,
		enableTooltip,
		help,
		hideLabelFromVision = false,
		inputRef,
		label,
		marks = false,
		max = 100,
		min = 0,
		onBlur = noop,
		onChange = noop,
		onFocus = noop,
		onMouseLeave = noop,
		onMouseMove = noop,
		renderTooltipContent = ( v ) => v,
		showTooltip,
		step = 1,
		value: valueProp,
		wrapperClassName,
		...otherProps
	} = useSliderControl( props );

	const id = useInstanceId( UnconnectedSliderControl, 'slider-control' );
	const describedBy = !! help ? `${ id }__help` : undefined;

	const value = valueProp;
	const isValueReset = value === null;
	const rangeFillValue = isValueReset ? ( max - min ) / 2 + min : value;
	const fillValue = isValueReset
		? 50
		: ( ( value - min ) / ( max - min ) ) * 100;
	const fillPercentage = clamp( fillValue, 0, 100 );

	return (
		<BaseControl
			className={ className }
			label={ label }
			hideLabelFromVision={ hideLabelFromVision }
			id={ `${ id }` }
			help={ help }
		>
			<VStack className={ wrapperClassName }>
				<Slider
					aria-describedby={ describedBy }
					className="components-range-control__slider"
					disabled={ disabled }
					id={ `${ id }` }
					label={ label }
					max={ max }
					min={ min }
					onBlur={ onBlur }
					onChange={ onChange }
					onFocus={ onFocus }
					onMouseLeave={ onMouseLeave }
					onMouseMove={ onMouseMove }
					ref={ useMergeRefs( [ inputRef, forwardedRef ] ) }
					step={ step }
					value={ isValueReset ? undefined : value }
					{ ...otherProps }
				/>
				<Marks
					disabled={ disabled }
					marks={ marks }
					max={ max }
					min={ min }
					step={ step }
					value={ rangeFillValue }
				/>
				{ enableTooltip && (
					<Tooltip
						inputRef={ inputRef }
						renderTooltipContent={ renderTooltipContent }
						show={ showTooltip }
						fillPercentage={ fillPercentage }
						value={ value }
					/>
				) }
			</VStack>
		</BaseControl>
	);
};

/**
 * `SliderControl` is a form component that lets users choose a value within a
 * range.
 *
 * @example
 * ```jsx
 * import { SliderControl } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *     <SliderControl />
 *   );
 * }
 * ```
 */
export const SliderControl = contextConnect(
	UnconnectedSliderControl,
	'SliderControl'
);
export default SliderControl;
