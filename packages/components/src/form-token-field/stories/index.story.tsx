/**
 * External dependencies
 */
import type { Meta, StoryFn } from '@storybook/react';
import type { ComponentProps } from 'react';
import styled from '@emotion/styled';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import FormTokenField from '../';
import CheckboxControl from '../../checkbox-control';
import Label from '../../input-control/label';

const meta: Meta< typeof FormTokenField > = {
	component: FormTokenField,
	title: 'Components/FormTokenField',
	argTypes: {
		value: {
			control: { type: null },
		},
		__experimentalValidateInput: {
			control: { type: null },
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
	__nextHasNoMarginBottom: true,
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
	__nextHasNoMarginBottom: true,
};

export const DropdownSelector: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
DropdownSelector.args = {
	...Default.args,
	__experimentalExpandOnFocus: true,
	__experimentalAutoSelectFirstMatch: true,
};

/**
 * The rendered output of each suggestion can be customized by passing a
 * render function to the `__experimentalRenderItem` prop. (This is still an experimental feature
 * and is subject to change.)
 */
export const WithCustomRenderItem: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
WithCustomRenderItem.args = {
	...Default.args,
	__experimentalRenderItem: ( { item } ) => (
		<div>{ `${ item } — a nice place to visit` }</div>
	),
};

/**
 * Only values for which the `__experimentalValidateInput` function returns
 * `true` will be tokenized. (This is still an experimental feature and is
 * subject to change.)
 */
export const WithValidatedInput: StoryFn< typeof FormTokenField > =
	DefaultTemplate.bind( {} );
WithValidatedInput.args = {
	...Default.args,
	__experimentalValidateInput: ( input: string ) =>
		continents.includes( input ),
};

const fruits = [
	'Apple',
	'Apricot',
	'Avocado',
	'Banana',
	'Blackberry',
	'Blueberry',
];

const CheckboxLabelWrapper = styled.div`
	.suggestion-checkbox-label {
		display: flex !important;
		align-items: center;
		color: inherit;
	}
`;

export const WithSuggestionCheckbox: StoryFn< typeof FormTokenField > = ( {
	suggestions,
	...args
} ) => {
	const [ selectedFruits, setSelectedFruits ] = useState<
		ComponentProps< typeof FormTokenField >[ 'value' ]
	>( [] );

	/*
	 * Combine the suggested fruits with
	 */
	let allFruits = suggestions ? [ ...suggestions ] : [];

	if ( selectedFruits ) {
		allFruits = allFruits.concat(
			selectedFruits.map( ( fruit ) => String( fruit ) )
		);

		// Remove duplicates
		allFruits = [ ...new Set( allFruits ) ];

		// Sort the values
		allFruits.sort();
	}

	return (
		<FormTokenField
			{ ...args }
			value={ selectedFruits }
			suggestions={ allFruits }
			onChange={ setSelectedFruits }
			__filterSuggestions={ ( _filteredSuggestions, value ) => {
				return allFruits.filter( ( suggestion ) =>
					suggestion.toLowerCase().includes( value.toLowerCase() )
				);
			} }
			__onSuggestionClick={ ( suggestion, isSuggestionTaken ) => {
				// If the suggestion is taken, filter the selected continents
				if ( isSuggestionTaken ) {
					const filteredContinents = selectedFruits?.filter(
						( continent ) => continent !== suggestion
					);
					setSelectedFruits( filteredContinents );
				}
			} }
			__experimentalRenderItem={ ( { item } ) => {
				const itemTaken = selectedFruits?.includes( item );
				return (
					<CheckboxLabelWrapper>
						<Label className="suggestion-checkbox-label">
							<CheckboxControl
								checked={ itemTaken }
								onChange={ () => {} }
							/>
							{ item }
						</Label>
					</CheckboxLabelWrapper>
				);
			} }
		/>
	);
};

WithSuggestionCheckbox.args = {
	label: 'Pick or create a fruit',
	suggestions: fruits,
	__nextHasNoMarginBottom: true,
	__experimentalExpandOnFocus: true,
	__experimentalAutoSelectFirstMatch: true,
	__forceSuggestionFocus: true,
};
