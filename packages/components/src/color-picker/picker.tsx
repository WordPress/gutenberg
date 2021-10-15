/**
 * External dependencies
 */
import { HslColorPicker, HslaColorPicker } from 'react-colorful';
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
	const Component = enableAlpha ? HslaColorPicker : HslColorPicker;
	const hslColor = useMemo( () => color.toHsl(), [ color ] );

	return (
		<Component
			color={ hslColor }
			onChange={ ( nextColor ) => {
				onChange( colord( nextColor ) );
			} }
		/>
	);
};
