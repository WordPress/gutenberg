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
		fallbackFontSize: {
			description:
				'If no value exists, this prop defines the starting position for the font size picker slider. Only relevant if `withSlider` is `true`.',
		},
		withReset: {
			description:
				'If `true`, a reset button will be displayed alongside the input field when a custom font size is active. Has no effect when `disableCustomFontSizes` or `withSlider` is `true`.',
			control: { type: 'boolean' },
			table: {
				type: 'boolean',
				defaultValue: { summary: true },
			},
		},
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
};

export const WithSlider = FontSizePickerWithState.bind( {} );
WithSlider.args = {
	...Default.args,
	fallbackFontSize: 16,
	initialValue: undefined,
	withSlider: true,
};

/**
 * With custom font sizes disabled via the `disableCustomFontSizes` prop, the user will
 * only be able to pick one of the predefined sizes passed in `fontSizes`.
 */
export const WithCustomSizesDisabled = FontSizePickerWithState.bind( {} );
WithCustomSizesDisabled.args = {
	...Default.args,
	disableCustomFontSizes: true,
};

/**
 * When there are more than 5 font size options, the UI is no longer a toggle group.
 */
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

/**
 * When units like `px` are specified explicitly, it will be shown as a label hint.
 */
export const WithUnits = TwoFontSizePickersWithState.bind( {} );
WithUnits.args = {
	...WithMoreFontSizes.args,
	fontSizes: WithMoreFontSizes.args.fontSizes.map( ( option ) => ( {
		...option,
		size: `${ option.size }px`,
	} ) ),
	initialValue: '8px',
};

/**
 * The label hint will not be shown if it is a complex CSS value. Some examples of complex CSS values
 * in this context are CSS functions like `calc()`, `clamp()`, and `var()`.
 */
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
