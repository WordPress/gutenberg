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
	argTypes: {
		initialValue: { table: { disable: true } }, // hide prop because it's not actually part of FontSizePicker
	},
	parameters: {
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};

const FontSizePickerWithState = ( { initialValue, ...props } ) => {
	const [ fontSize, setFontSize ] = useState( initialValue );
	return (
		<FontSizePicker
			{ ...props }
			value={ fontSize }
			onChange={ setFontSize }
		/>
	);
};

const TwoFontSizePickersWithState = ( { fontSizes, ...props } ) => {
	return (
		<>
			<h2>Fewer font sizes</h2>
			<FontSizePickerWithState
				{ ...props }
				fontSizes={ fontSizes.slice( 0, 4 ) }
			/>

			<h2>More font sizes</h2>
			<FontSizePickerWithState { ...props } fontSizes={ fontSizes } />
		</>
	);
};

export const Default = FontSizePickerWithState.bind( {} );
Default.args = {
	disableCustomFontSizes: false,
	fontSizes: [
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
	],
	initialValue: 16,
	withSlider: false,
	withReset: true,
};

export const WithSlider = FontSizePickerWithState.bind( {} );
WithSlider.args = {
	...Default.args,
	fallbackFontSize: 16,
	initialValue: undefined,
	withSlider: true,
};

export const WithoutCustomSizes = FontSizePickerWithState.bind( {} );
WithoutCustomSizes.args = {
	...Default.args,
	disableCustomFontSizes: true,
};

export const WithMoreFontSizes = FontSizePickerWithState.bind( {} );
WithMoreFontSizes.args = {
	...Default.args,
	fontSizes: [
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
	],
	initialValue: 8,
};

export const WithUnits = TwoFontSizePickersWithState.bind( {} );
WithUnits.args = {
	...WithMoreFontSizes.args,
	fontSizes: WithMoreFontSizes.args.fontSizes.map( ( option ) => ( {
		...option,
		size: `${ option.size }px`,
	} ) ),
	initialValue: '8px',
};

export const WithComplexCSSValues = TwoFontSizePickersWithState.bind( {} );
WithComplexCSSValues.args = {
	...Default.args,
	fontSizes: [
		{
			name: 'Small',
			slug: 'small',
			// Adding just one complex css value is enough
			size: 'clamp(1.75rem, 3vw, 2.25rem)',
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
	],
	initialValue: '1.125rem',
};
