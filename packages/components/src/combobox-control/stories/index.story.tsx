/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import ComboboxControl from '..';
import type { ComboboxControlProps } from '../types';

const countries = [
	{ name: 'Afghanistan', code: 'AF' },
	{ name: 'Åland Islands', code: 'AX' },
	{ name: 'Albania', code: 'AL' },
	{ name: 'Algeria', code: 'DZ' },
	{ name: 'American Samoa', code: 'AS' },
	{ name: 'Andorra', code: 'AD' },
	{ name: 'Angola', code: 'AO' },
	{ name: 'Anguilla', code: 'AI' },
	{ name: 'Antarctica', code: 'AQ' },
	{ name: 'Antigua and Barbuda', code: 'AG' },
	{ name: 'Argentina', code: 'AR' },
	{ name: 'Armenia', code: 'AM' },
	{ name: 'Aruba', code: 'AW' },
	{ name: 'Australia', code: 'AU' },
	{ name: 'Austria', code: 'AT' },
	{ name: 'Azerbaijan', code: 'AZ' },
];

const meta: Meta< typeof ComboboxControl > = {
	title: 'Components/ComboboxControl',
	component: ComboboxControl,
	argTypes: {
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const mapCountryOption = ( country: ( typeof countries )[ number ] ) => ( {
	value: country.code,
	label: country.name,
} );

const countryOptions = countries.map( mapCountryOption );

const Template: StoryFn< typeof ComboboxControl > = ( {
	onChange,
	...args
} ) => {
	const [ value, setValue ] =
		useState< ComboboxControlProps[ 'value' ] >( null );

	return (
		<>
			<ComboboxControl
				{ ...args }
				value={ value }
				onChange={ ( ...changeArgs ) => {
					setValue( ...changeArgs );
					onChange?.( ...changeArgs );
				} }
			/>
		</>
	);
};
export const Default = Template.bind( {} );
Default.args = {
	__nextHasNoMarginBottom: true,
	allowReset: false,
	label: 'Select a country',
	options: countryOptions,
};

/**
 * The rendered output of each suggestion can be customized by passing a
 * render function to the `__experimentalRenderItem` prop. (This is still an experimental feature
 * and is subject to change.)
 */
export const WithCustomRenderItem = Template.bind( {} );
WithCustomRenderItem.args = {
	...Default.args,
	label: 'Select an author',
	options: [
		{
			value: 'parsley',
			label: 'Parsley Montana',
			age: 48,
			country: 'Germany',
		},
		{
			value: 'cabbage',
			label: 'Cabbage New York',
			age: 44,
			country: 'France',
		},
		{
			value: 'jake',
			label: 'Jake Weary',
			age: 41,
			country: 'United Kingdom',
		},
	],
	__experimentalRenderItem: ( { item } ) => {
		const { label, age, country } = item;
		return (
			<div>
				<div style={ { marginBottom: '0.2rem' } }>{ label }</div>
				<small>
					Age: { age }, Country: { country }
				</small>
			</div>
		);
	},
};

/**
 * You can disable options in the list
 * by setting the `disabled` property to true
 * for individual items in the option object.
 */
export const WithDisabledOptions = Template.bind( {} );
const optionsWithDisabledOptions = countryOptions.map( ( option, index ) => ( {
	...option,
	disabled: index % 3 === 0, // Disable options at index 0, 3, 6, etc.
} ) );

WithDisabledOptions.args = {
	...Default.args,
	options: optionsWithDisabledOptions,
};

/**
 * By default, the combobox expands when focused.
 * You can disable this behavior by setting the `expandOnFocus` prop to `false`.
 * This is useful when you want to show the suggestions only when the user interacts with the input.
 */
export const NotExpandOnFocus = Template.bind( {} );

NotExpandOnFocus.args = {
	...Default.args,
	options: countryOptions,
	expandOnFocus: false,
};
