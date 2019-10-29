
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
	return (
		<FontSizePicker
			{ ...props }
			value={ fontSize }
			onChange={ setFontSize }
		/>
	);
};

export const _default = () => {
	const fontSizes = [
		{
			name: 'Small',
			slug: 'small',
			size: 12,
		},
		{
			name: 'Normal',
			slug: 'normal',
			size: 18,
		},

		{
			name: 'Big',
			slug: 'big',
			size: 26,
		},
	];
	const fallbackFontSize = 16;

	return (
		<FontSizePickerWithState
			fontSizes={ fontSizes }
			fallbackFontSize={ fallbackFontSize }
		/>
	);
};
