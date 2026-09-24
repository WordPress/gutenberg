import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ComponentType, ReactNode } from 'react';
import * as Combobox from '../index';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

type Item = ( typeof ITEMS )[ number ];

function renderDisabledMultiSelect() {
	return render(
		<Combobox.Root< Item, true >
			items={ ITEMS }
			multiple
			disabled
			defaultValue={ [ ITEMS[ 0 ] ] }
		>
			<Combobox.Chips>
				<Combobox.Value>
					{ ( value: Item[] ) => (
						<>
							{ value.map( ( item ) => (
								<Combobox.ChipWithRemove key={ item.id }>
									{ item.value }
								</Combobox.ChipWithRemove>
							) ) }
							<Combobox.Clear />
						</>
					) }
				</Combobox.Value>
			</Combobox.Chips>
			<Combobox.Popup>
				<Combobox.List>
					<Combobox.ListBody>
						<Combobox.Collection>
							{ ( item ) => (
								<Combobox.Item key={ item.id } value={ item }>
									<Combobox.ItemLabel>
										{ item.value }
									</Combobox.ItemLabel>
								</Combobox.Item>
							) }
						</Combobox.Collection>
					</Combobox.ListBody>
				</Combobox.List>
			</Combobox.Popup>
		</Combobox.Root>
	);
}

describe( 'Combobox', () => {
	it( 'uses the item label as its accessible name and describes it in order', () => {
		const item = { value: 'apple', label: 'Apple' };

		render(
			<Combobox.Root items={ [ item ] } inline open>
				<Combobox.List>
					<Combobox.Item value={ item }>
						<Combobox.ItemLabel>Apple</Combobox.ItemLabel>
						<Combobox.ItemDescription>
							Fresh fruit.
						</Combobox.ItemDescription>
						<Combobox.ItemDescription>
							In stock.
						</Combobox.ItemDescription>
					</Combobox.Item>
				</Combobox.List>
			</Combobox.Root>
		);

		const option = screen.getByRole( 'option', { name: 'Apple' } );
		expect( option ).toHaveAccessibleDescription(
			'Fresh fruit. In stock.'
		);
	} );

	it( 'requires an ItemLabel as the first direct child', () => {
		const InvalidItem = Combobox.Item as ComponentType< {
			value: string;
			children?: ReactNode;
		} >;

		expect( () =>
			render(
				<Combobox.Root items={ [ 'Apple' ] } inline open>
					<Combobox.List>
						<InvalidItem value="Apple">Apple</InvalidItem>
					</Combobox.List>
				</Combobox.Root>
			)
		).toThrow( 'Combobox.ItemLabel must be the first direct child' );
		expect( console ).toHaveErrored();
	} );

	it( 'renders a default trigger placeholder when no value is selected', () => {
		render(
			<Combobox.Root items={ ITEMS }>
				<Combobox.Trigger />
			</Combobox.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Select' );
	} );

	it( 'supports custom trigger placeholder text', () => {
		render(
			<Combobox.Root items={ ITEMS }>
				<Combobox.Trigger placeholder="Choose an item" />
			</Combobox.Root>
		);

		const trigger = screen.getByRole( 'combobox' );

		expect( trigger ).toHaveTextContent( 'Choose an item' );
	} );

	describe( 'when disabled', () => {
		it( 'hides the chip remove button from screen readers', () => {
			renderDisabledMultiSelect();

			expect(
				screen.queryByRole( 'button', { name: 'Remove' } )
			).not.toBeInTheDocument();
		} );

		it( 'hides the clear button from screen readers', () => {
			renderDisabledMultiSelect();

			expect(
				screen.queryByRole( 'button', { name: 'Clear' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
