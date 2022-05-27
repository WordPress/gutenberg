/**
 * External dependencies
 */
import type { ComponentMeta, ComponentStory } from '@storybook/react';
import type { ComponentProps } from 'react';
/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormTokenField from '../';

const meta: ComponentMeta< typeof FormTokenField > = {
	component: FormTokenField,
	title: 'Components/FormTokenField',
	argTypes: {
		value: {
			control: { type: null },
		},
		__experimentalValidateInput: {
			control: { type: 'boolean' },
		},
	},
	parameters: {
		controls: {
			expanded: true,
		},
		docs: { source: { state: 'open' } },
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

const DefaultTemplate: ComponentStory< typeof FormTokenField > = ( {
	__experimentalValidateInput,
	...args
} ) => {
	const [ selectedContinents, setSelectedContinents ] = useState<
		ComponentProps< typeof FormTokenField >[ 'value' ]
	>( [] );

	return (
		<FormTokenField
			{ ...args }
			value={ selectedContinents }
			onChange={ ( tokens ) => setSelectedContinents( tokens ) }
			__experimentalValidateInput={
				__experimentalValidateInput
					? ( newValue ) => continents.includes( newValue )
					: () => true
			}
		/>
	);
};

export const Default: ComponentStory<
	typeof FormTokenField
> = DefaultTemplate.bind( {} );
Default.args = {
	label: 'Type a continent',
	suggestions: continents,
};

export const Async: ComponentStory< typeof FormTokenField > = ( {
	__experimentalValidateInput,
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
			__experimentalValidateInput={
				__experimentalValidateInput
					? ( newValue ) => continents.includes( newValue )
					: () => true
			}
		/>
	);
};
Async.args = {
	label: 'Type a continent',
	suggestions: continents,
};
