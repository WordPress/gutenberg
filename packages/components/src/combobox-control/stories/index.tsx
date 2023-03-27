/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';

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
];

const meta: ComponentMeta< typeof ComboboxControl > = {
	title: 'Components/ComboboxControl',
	component: ComboboxControl,
	argTypes: {
		value: { control: { type: null } },
	},
	parameters: {
		actions: { argTypesRegex: '^on.*' },
		controls: { expanded: true },
		docs: { source: { state: 'open' } },
	},
};
export default meta;

const mapCountryOption = ( country: ( typeof countries )[ number ] ) => ( {
	value: country.code,
	label: country.name,
} );

const countryOptions = countries.map( mapCountryOption );

const Template: ComponentStory< typeof ComboboxControl > = ( {
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
	__next36pxDefaultSize: false,
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
