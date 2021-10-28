/**
 * External dependencies
 */
import { number, object, boolean } from '@storybook/addon-knobs';

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
	parameters: {
		knobs: { disabled: false },
	},
};

const FontSizePickerWithState = ( { initialValue, ...props } ) => {
	const [ fontSize, setFontSize ] = useState( initialValue || 16 );

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

export const differentControlBySize = () => {
	const options = [
		{
			name: 'Tiny',
			slug: 'tiny',
			size: 8,
		},
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
		{
			name: 'Bigger',
			slug: 'bigger',
			size: 30,
		},
		{
			name: 'Huge',
			slug: 'huge',
			size: 36,
		},
	];
	const optionsWithUnits = options.map( ( option ) => ( {
		...option,
		size: `${ option.size }px`,
	} ) );
	const showMoreFontSizes = boolean( 'Add more font sizes', false );
	const addUnitsToSizes = boolean( 'Add units to font sizes', false );
	const _options = addUnitsToSizes ? optionsWithUnits : options;
	const fontSizes = _options.slice(
		0,
		showMoreFontSizes ? _options.length : 4
	);
	return (
		<FontSizePickerWithState fontSizes={ fontSizes } initialValue={ 8 } />
	);
};
