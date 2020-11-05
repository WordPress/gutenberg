/**
 * External dependencies
 */
import { number, object } from '@storybook/addon-knobs';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FontSizePicker from '../';

export default {
	title: 'Components/FontSizePicker',
	component: FontSizePicker,
};

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
	const fontSizes = object( 'Font Sizes', [
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
	] );
	return <FontSizePickerWithState fontSizes={ fontSizes } />;
};

export const withSlider = () => {
	const fontSizes = object( 'Font Sizes', [
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
	] );
	const fallbackFontSize = number( 'Fallback Font Size - Slider Only', 16 );
	return (
		<FontSizePickerWithState
			fontSizes={ fontSizes }
			fallbackFontSize={ fallbackFontSize }
			withSlider
		/>
	);
};

export const withoutCustomSizes = () => {
	const fontSizes = object( 'Font Sizes', [
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
	] );
	return (
		<FontSizePickerWithState
			fontSizes={ fontSizes }
			disableCustomFontSizes
		/>
	);
};
