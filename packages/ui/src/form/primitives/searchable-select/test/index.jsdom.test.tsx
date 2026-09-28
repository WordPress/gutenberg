import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import warning from '@wordpress/warning';
import type { Item, ItemGroup } from '../types';
import { SearchableSelect } from '../index';

const ITEMS: Item[] = [
	{ value: 'apple', label: 'Apple' },
	{ value: 'apricot', label: 'Apricot' },
	{ value: 'banana', label: 'Banana' },
];

const GROUPED_ITEMS: ItemGroup[] = [
	{
		label: 'Common',
		items: [
			{ value: 'apple', label: 'Apple' },
			{ value: 'banana', label: 'Banana' },
			{ value: 'orange', label: 'Orange' },
		],
	},
	{
		label: 'Berries',
		items: [
			{ value: 'strawberry', label: 'Strawberry' },
			{ value: 'blueberry', label: 'Blueberry' },
			{ value: 'raspberry', label: 'Raspberry' },
		],
	},
];

vi.mock( import( '@wordpress/warning' ), async ( importOriginal ) => {
	const original = await importOriginal();

	return {
		...original,
		default: vi.fn(),
	} as unknown as typeof original;
} );

const mockedWarning = vi.mocked( warning );

describe( 'SearchableSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLButtonElement >();

		render( <SearchableSelect ref={ ref } /> );

		expect( ref.current ).toBeInstanceOf( HTMLButtonElement );
	} );

	it( 'does not throw when triggerContent receives a null value', () => {
		render(
			<SearchableSelect
				aria-label="Fruit"
				items={ ITEMS }
				triggerContent={ ( value: Item | null ) =>
					value ? (
						<span>{ value.label }</span>
					) : (
						<span>Choose fruit</span>
					)
				}
			/>
		);

		expect(
			screen.getByRole( 'combobox', { name: 'Fruit' } )
		).toHaveTextContent( 'Choose fruit' );
	} );

	it( 'warns when grouped items are used without children', () => {
		render( <SearchableSelect items={ GROUPED_ITEMS } /> );

		expect( mockedWarning ).toHaveBeenCalledWith(
			'SearchableSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
		);
	} );

	it( 'warns when multiple creatable items are provided', () => {
		render(
			<SearchableSelect
				items={ [
					{
						value: '__create-a__',
						label: 'Create A',
						creatable: true,
					},
					{
						value: '__create-b__',
						label: 'Create B',
						creatable: true,
					},
				] }
			/>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			'SearchableSelect: expected at most one item with `creatable: true` in `items`.'
		);
	} );

	it( 'warns when a group mixes regular items with a creatable item', () => {
		render(
			<SearchableSelect
				items={ [
					{
						label: 'Common',
						items: [
							GROUPED_ITEMS[ 0 ].items[ 0 ],
							{
								value: '__create__',
								label: 'Create new item',
								creatable: true,
							},
						],
					},
				] }
				children={ ( group: ItemGroup ) => (
					<SearchableSelect.Group
						key={ group.label }
						items={ group.items }
					>
						<SearchableSelect.GroupLabel>
							{ group.label }
						</SearchableSelect.GroupLabel>
						<SearchableSelect.Collection>
							{ ( item: Item ) => (
								<SearchableSelect.Item
									key={ item.value }
									value={ item }
								>
									{ item.label }
								</SearchableSelect.Item>
							) }
						</SearchableSelect.Collection>
					</SearchableSelect.Group>
				) }
			/>
		);

		expect( mockedWarning ).toHaveBeenCalledWith(
			'SearchableSelect: do not mix `creatable: true` items with regular items in the same group. Put the creatable item in its own group.'
		);
	} );
} );
