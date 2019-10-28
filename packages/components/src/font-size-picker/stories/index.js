/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';

export default { title: 'FontSizePicker', component: FontSizePicker };

const FontSizePickerWithState = ( { ...props } ) => {
	const [ fontSize, setFontSize ] = useState( 16 );
	const fontSizes = [
		{
			name: 'Small',
			slug: 'small',
			size: 12,
		},
		{
			name: 'Normal',
			slug: 'normal',
			size: 16,
		},
		{
			name: 'Big',
			slug: 'big',
			size: 26,
		},
	];
	const fallbackFontSize = 16;

	return (
		<FontSizePicker
			{ ...props }
			fontSizes={ fontSizes }
			fallbackFontSize={ fallbackFontSize }
			value={ fontSize }
			onChange={ setFontSize }
		/>
	);
};

export const _default = () => {
	return (
		<FontSizePickerWithState />
	);
};

export const withSlider = () => {
	return (
		<FontSizePickerWithState
			withSlider={ true }
		/>
	);
};

export const withoutCustomSizes = () => {
	return (
		<FontSizePickerWithState
			disableCustomFontSizes={ true }
		/>
	);
};
