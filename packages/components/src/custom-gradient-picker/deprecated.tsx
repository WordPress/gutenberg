import deprecated from '@wordpress/deprecated';
import { CustomGradientPicker as InternalCustomGradientPicker } from '.';
import type { CustomGradientPickerProps } from './types';

/**
 * CustomGradientPicker is a React component that renders a UI for specifying
 * linear or radial gradients. Radial gradients are displayed in the picker as
 * a slice of the gradient from the center to the outside.
 *
 * This component is deprecated. Use `GradientPicker` with `clearable={ false }`
 * instead. Without the `gradients` prop, it renders the same gradient editor
 * without presets or a Clear button.
 *
 * `GradientPicker` types its `onChange` argument as `string | undefined`.
 * Without presets or a Clear button it only passes a string, but a callback
 * that accepts only a string needs to narrow the value first.
 *
 * @deprecated Use `GradientPicker` with `clearable={ false }` instead.
 *
 * ```jsx
 * import { GradientPicker } from '@wordpress/components';
 * import { useState } from '@wordpress/element';
 *
 * const MyGradientEditor = () => {
 *   const [ gradient, setGradient ] = useState();
 *
 *   return (
 *     <GradientPicker
 *       clearable={ false }
 *       value={ gradient }
 *       onChange={ setGradient }
 *     />
 *   );
 * };
 * ```
 */
export function CustomGradientPicker( props: CustomGradientPickerProps ) {
	deprecated( 'wp.components.CustomGradientPicker', {
		since: '7.3',
		alternative: 'wp.components.GradientPicker',
		hint: 'Set `clearable={ false }` to render only the custom gradient editor.',
	} );

	return <InternalCustomGradientPicker { ...props } />;
}

export default CustomGradientPicker;
