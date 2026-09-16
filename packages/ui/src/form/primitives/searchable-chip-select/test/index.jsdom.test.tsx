import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import warning from '@wordpress/warning';
import type { Item, ItemGroup } from '../types';
import { SearchableChipSelect } from '../index';
import { GROUPED_ITEMS, ITEMS } from './__fixtures__';

vi.mock( import( '@wordpress/warning' ), () => ( { default: vi.fn() } ) );

const mockedWarning = vi.mocked( warning );

const CHIP_REMOVE_HINT = 'Press Backspace or Delete to remove.';

function getChip( name: string ) {
	return screen.getByText( ( _content, element ) => {
		return (
			element instanceof HTMLElement &&
			element.tagName === 'DIV' &&
			element.hasAttribute( 'aria-describedby' ) &&
			( element.textContent ?? '' ).includes( name )
		);
	} );
}

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

	describe( 'selection accessibility', () => {
		it( 'does not describe the combobox with a selection hint when nothing is selected', () => {
			render(
				<SearchableChipSelect aria-label="Fruit" items={ ITEMS } />
			);

			expect(
				screen.getByRole( 'combobox', { name: 'Fruit' } )
			).not.toHaveAccessibleDescription();
			expect(
				screen.queryByRole( 'toolbar', { name: 'Selected item' } )
			).not.toBeInTheDocument();
			expect(
				screen.queryByRole( 'toolbar', { name: 'Selected items' } )
			).not.toBeInTheDocument();
		} );

		it( 'labels the chips toolbar as Selected item when one item is selected', () => {
			render(
				<SearchableChipSelect
					aria-label="Fruit"
					items={ ITEMS }
					defaultValue={ [ ITEMS[ 0 ] ] }
				/>
			);

			expect(
				screen.getByRole( 'toolbar', { name: 'Selected item' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'combobox', { name: 'Fruit' } )
			).toHaveAccessibleDescription(
				'1 item selected. From the start of the input, press Left Arrow to move to the selected item.'
			);
		} );

		it( 'labels the chips toolbar as Selected items when two items are selected', () => {
			render(
				<SearchableChipSelect
					aria-label="Fruit"
					items={ ITEMS }
					defaultValue={ [ ITEMS[ 0 ], ITEMS[ 2 ] ] }
				/>
			);

			expect(
				screen.getByRole( 'toolbar', { name: 'Selected items' } )
			).toBeVisible();
			expect(
				screen.getByRole( 'combobox', { name: 'Fruit' } )
			).toHaveAccessibleDescription(
				'2 items selected. From the start of the input, press Left Arrow to move to the selected items.'
			);
		} );

		it( 'describes each selected chip with the Backspace or Delete hint', () => {
			render(
				<SearchableChipSelect
					aria-label="Fruit"
					items={ ITEMS }
					defaultValue={ [ ITEMS[ 0 ], ITEMS[ 2 ] ] }
				/>
			);

			expect( getChip( 'Apple' ) ).toHaveAccessibleDescription(
				CHIP_REMOVE_HINT
			);
			expect( getChip( 'Apple' ) ).not.toHaveAttribute(
				'aria-description'
			);
			expect( getChip( 'Banana' ) ).toHaveAccessibleDescription(
				CHIP_REMOVE_HINT
			);
			expect( getChip( 'Banana' ) ).not.toHaveAttribute(
				'aria-description'
			);
		} );

		it( 'keeps the chip Backspace or Delete description when chipsContent returns ChipWithRemove', () => {
			render(
				<SearchableChipSelect
					aria-label="Fruit"
					items={ ITEMS }
					defaultValue={ [ ITEMS[ 0 ] ] }
					chipsContent={ ( selected ) =>
						selected.map( ( item ) => (
							<SearchableChipSelect.ChipWithRemove
								key={ item.value }
							>
								{ item.label }
							</SearchableChipSelect.ChipWithRemove>
						) )
					}
				/>
			);

			expect( getChip( 'Apple' ) ).toHaveAccessibleDescription(
				CHIP_REMOVE_HINT
			);
		} );

		it( 'keeps a consumer aria-describedby when items are selected', () => {
			render(
				<>
					<SearchableChipSelect
						aria-label="Fruit"
						items={ ITEMS }
						defaultValue={ [ ITEMS[ 0 ] ] }
						aria-describedby="searchable-chip-select-description"
					/>
					{ /* eslint-disable-next-line no-restricted-syntax -- stable test ids */ }
					<p id="searchable-chip-select-description">
						My description
					</p>
				</>
			);

			expect(
				screen.getByRole( 'combobox', { name: 'Fruit' } )
			).toHaveAccessibleDescription(
				expect.stringContaining( 'My description' )
			);
			expect(
				screen.getByRole( 'combobox', { name: 'Fruit' } )
			).toHaveAccessibleDescription(
				expect.stringContaining(
					'1 item selected. From the start of the input, press Left Arrow to move to the selected item.'
				)
			);
		} );
	} );
} );
