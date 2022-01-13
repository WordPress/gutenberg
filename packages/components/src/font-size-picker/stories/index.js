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
		knobs: { disable: false },
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

export const withComplexCSSValues = () => {
	const options = [
		{
			name: 'Small',
			slug: 'small',
			size: '0.65rem',
		},
		{
			name: 'Medium',
			slug: 'medium',
			size: '1.125rem',
		},
		{
			name: 'Large',
			slug: 'large',
			size: '1.7rem',
		},
		{
			name: 'Extra Large',
			slug: 'extra-large',
			size: '1.95rem',
		},
		{
			name: 'Extra Extra Large',
			slug: 'extra-extra-large',
			size: '2.5rem',
		},
		{
			name: 'Huge',
			slug: 'huge',
			size: '2.8rem',
		},
	];
	const showMoreFontSizes = boolean( 'Add more font sizes', false );
	const addComplexCssValues = boolean(
		'Add some complex css values(calc, var, etc..)',
		true
	);

	const _options = options.map( ( option, index ) => {
		const _option = { ...option };
		// Adding just one complex css value is enough (first element);
		if ( addComplexCssValues && ! index ) {
			_option.size = 'clamp(1.75rem, 3vw, 2.25rem)';
		}
		return _option;
	} );

	const fontSizes = _options.slice(
		0,
		showMoreFontSizes ? _options.length : 5
	);
	return (
		<div style={ { maxWidth: '248px' } }>
			<FontSizePickerWithState
				fontSizes={ fontSizes }
				initialValue={ '1.125rem' }
			/>
		</div>
	);
};
