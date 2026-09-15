import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render } from '@testing-library/react';
import warning from '@wordpress/warning';
import type { Item, ItemGroup } from '../types';
import { SearchableChipSelect } from '../index';
import { GROUPED_ITEMS } from './__fixtures__';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

const mockedWarning = vi.mocked( warning );

describe( 'SearchableChipSelect', () => {
	beforeEach( () => {
		mockedWarning.mockClear();
	} );

	describe( 'development warnings', () => {
		it( 'warns when grouped items are used without children', () => {
			render( <SearchableChipSelect items={ GROUPED_ITEMS } /> );

			expect( mockedWarning ).toHaveBeenCalledWith(
				'SearchableChipSelect: grouped `items` require a `children` renderer. See the `Grouped` story for an example.'
			);
		} );

		it( 'warns when multiple creatable items are provided', () => {
			render(
				<SearchableChipSelect
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
				'SearchableChipSelect: expected at most one item with `creatable: true` in `items`.'
			);
		} );

		it( 'warns when a group mixes regular items with a creatable item', () => {
			render(
				<SearchableChipSelect
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
						<SearchableChipSelect.Group
							key={ group.label }
							items={ group.items }
						>
							<SearchableChipSelect.GroupLabel>
								{ group.label }
							</SearchableChipSelect.GroupLabel>
							<SearchableChipSelect.Collection>
								{ ( item: Item ) => (
									<SearchableChipSelect.Item
										key={ item.value }
										value={ item }
									>
										{ item.label }
									</SearchableChipSelect.Item>
								) }
							</SearchableChipSelect.Collection>
						</SearchableChipSelect.Group>
					) }
				/>
			);

			expect( mockedWarning ).toHaveBeenCalledWith(
				'SearchableChipSelect: do not mix `creatable: true` items with regular items in the same group. Put the creatable item in its own group.'
			);
		} );
	} );
} );
