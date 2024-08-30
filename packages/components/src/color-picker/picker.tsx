/**
 * External dependencies
 */
import { RgbStringColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { PickerProps } from './types';

export const Picker = ( { color, enableAlpha, onChange }: PickerProps ) => {
	const Component = enableAlpha
		? RgbaStringColorPicker
		: RgbStringColorPicker;
	const rgbColor = useMemo( () => color.toRgbString(), [ color ] );

	return (
		<Component
			color={ rgbColor }
			onChange={ ( nextColor ) => {
				onChange( colord( nextColor ) );
			} }
			// Pointer capture fortifies drag gestures so that they continue to
			// work while dragging outside the component over objects like
			// iframes. If a newer version of react-colorful begins to employ
			// pointer capture this will be redundant and should be removed.
			onPointerDown={ ( { currentTarget, pointerId } ) => {
				currentTarget.setPointerCapture( pointerId );
			} }
			onPointerUp={ ( { currentTarget, pointerId } ) => {
				currentTarget.releasePointerCapture( pointerId );
			} }
		/>
	);
};
