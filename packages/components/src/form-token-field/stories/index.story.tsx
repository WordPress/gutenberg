/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react-vite';
import type { ComponentProps } from 'react';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormTokenField from '../';

const meta: Meta< typeof FormTokenField > = {
	component: FormTokenField,
	title: 'Components/Selection & Input/Common/FormTokenField',
	id: 'components-formtokenfield',
	argTypes: {
		value: {
			control: false,
		},
		__experimentalValidateInput: {
			control: false,
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { canvas: { sourceState: 'shown' } },
	},
};
export default meta;

const continents = [
	'Africa',
	'America',
	'Antarctica',
	'Asia',
	'Europe',
	'Oceania',
];

const DefaultTemplate: StoryFn< typeof FormTokenField > = ( { ...args } ) => {
	const [ selectedContinents, setSelectedContinents ] = useState<
		ComponentProps< typeof FormTokenField >[ 'value' ]
	>( [] );

	return (
		<FormTokenField
			{ ...args }
			value={ selectedContinents }
			onChange={ ( tokens ) => setSelectedContinents( tokens ) }
		/>
	);
};

export const Default: StoryFn< typeof FormTokenField > = DefaultTemplate.bind(
	{}
);
Default.args = {
	label: 'Type a continent',
	suggestions: continents,
	__next40pxDefaultSize: true,
};

export const Async: StoryFn< typeof FormTokenField > = ( {
	suggestions,
	...args
} ) => {
	const [ selectedContinents, setSelectedContinents ] = useState<
		ComponentProps< typeof FormTokenField >[ 'value' ]
	>( [] );
	const [ availableContinents, setAvailableContinents ] = useState<
		string[]
	>( [] );

	const searchContinents = ( input: string ) => {
		const timeout = setTimeout( () => {
			const available = ( suggestions || [] ).filter( ( continent ) =>
				continent.toLowerCase().includes( input.toLowerCase() )
			);
			setAvailableContinents( available );
		}, 1000 );

		return () => clearTimeout( timeout );
	};

	return (
		<FormTokenField
			{ ...args }
			value={ selectedContinents }
			suggestions={ availableContinents }
			onChange={ ( tokens ) => setSelectedContinents( tokens ) }
			onInputChange={ searchContinents }
		/>
	);
};
Async.args = {
	label: 'Type a continent',
	suggestions: continents,
	__next40pxDefaultSize: true,
};

export const DropdownSelector: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
DropdownSelector.args = {
	...Default.args,
	__experimentalExpandOnFocus: true,
	__experimentalAutoSelectFirstMatch: true,
};

/**
 * The rendered content of each token can be customized by passing a
 * render function to the `displayTransform` prop.
 *
 * Similarly, each suggestion can be customized by passing a
 * render function to the `__experimentalRenderItem` prop. (This is still an
 * experimental feature and is subject to change.)
 */
export const WithCustomRenderedItems: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
WithCustomRenderedItems.args = {
	...Default.args,
	displayTransform: ( token ) => `📍 ${ token }`,
	__experimentalRenderItem: ( { item } ) => (
		<div>{ `${ item } — a nice place to visit` }</div>
	),
	__experimentalExpandOnFocus: true,
};

/**
 * Only values for which the `__experimentalValidateInput` function returns
 * `true` will be tokenized. (This is still an experimental feature and is
 * subject to change.)
 *
 * In this example, the user can only add tokens that are already in the list.
 */
export const ValidateNewTokens: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
ValidateNewTokens.args = {
	...Default.args,
	__experimentalValidateInput: ( input: string ) =>
		continents.includes( input ),
	__experimentalExpandOnFocus: true,
};
