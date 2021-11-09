/**
 * External dependencies
 */
import { RgbStringColorPicker, RgbaStringColorPicker } from 'react-colorful';
import { colord, Colord } from 'colord';

/**
 * WordPress dependencies
 */
import { useMemo } from '@wordpress/element';
interface PickerProps {
	color: Colord;
	enableAlpha: boolean;
	onChange: ( nextColor: Colord ) => void;
}

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
		/>
	);
};
