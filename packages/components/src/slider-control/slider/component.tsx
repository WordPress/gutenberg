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

export const Slider = contextConnect( UnconnectedSlider, 'Slider' );
export default Slider;
