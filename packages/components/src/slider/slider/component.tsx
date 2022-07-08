/**
 * Internal dependencies
 */
import { contextConnect, WordPressComponentProps } from '../../ui/context';
import { useSlider } from './hook';

import type { SliderProps } from '../types';

const UnconnectedSlider = (
	props: WordPressComponentProps< SliderProps, 'input', false >,
	forwardedRef: React.ForwardedRef< any >
) => {
	const inputProps = useSlider( props );
	return <input { ...inputProps } ref={ forwardedRef } />;
};

/**
 * `Slider` is a form component that lets users choose a value within a range.
 *
 * @example
 * ```jsx
 * import { Slider } from `@wordpress/components`
 *
 * function Example() {
 *   return (
 *     <Slider />
 *   );
 * }
 * ```
 */
export const Slider = contextConnect( UnconnectedSlider, 'Slider' );
export default Slider;
