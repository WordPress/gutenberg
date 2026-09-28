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

	it( 'names chips from content and describes shared Remove buttons with that label', () => {
		render(
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
				defaultValue={ [ ITEMS[ 0 ], ITEMS[ 1 ] ] }
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
							</>
						) }
					</Combobox.Value>
				</Combobox.Chips>
			</Combobox.Root>
		);

		expect( screen.getByLabelText( 'Item 1' ) ).toHaveAccessibleName(
			'Item 1'
		);
		expect( screen.getByLabelText( 'Item 2' ) ).toHaveAccessibleName(
			'Item 2'
		);

		const removeButtons = screen.getAllByRole( 'button', {
			name: 'Remove',
		} );
		expect( removeButtons ).toHaveLength( 2 );
		expect( removeButtons[ 0 ] ).toHaveAccessibleDescription( 'Item 1' );
		expect( removeButtons[ 1 ] ).toHaveAccessibleDescription( 'Item 2' );
	} );

	it( 'names chips from mixed content without an aria-label', () => {
		render(
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
				defaultValue={ [ ITEMS[ 0 ] ] }
			>
				<Combobox.Chips>
					<Combobox.Value>
						{ ( value: Item[] ) => (
							<>
								{ value.map( ( item ) => (
									<Combobox.ChipWithRemove key={ item.id }>
										<span aria-hidden="true">*</span>
										{ item.value }
									</Combobox.ChipWithRemove>
								) ) }
							</>
						) }
					</Combobox.Value>
				</Combobox.Chips>
			</Combobox.Root>
		);

		expect( screen.getByLabelText( /Item 1/ ) ).toHaveAccessibleName(
			'Item 1'
		);
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toHaveAccessibleDescription( 'Item 1' );
	} );

	it( 'uses a consumer aria-label instead of chip content', () => {
		render(
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
				defaultValue={ [ ITEMS[ 0 ] ] }
			>
				<Combobox.Chips>
					<Combobox.Value>
						{ ( value: Item[] ) => (
							<>
								{ value.map( ( item ) => (
									<Combobox.ChipWithRemove
										key={ item.id }
										aria-label="Apple"
									>
										{ item.value }
									</Combobox.ChipWithRemove>
								) ) }
							</>
						) }
					</Combobox.Value>
				</Combobox.Chips>
			</Combobox.Root>
		);

		expect( screen.getByLabelText( 'Apple' ) ).toHaveAccessibleName(
			'Apple'
		);
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toHaveAccessibleDescription( 'Apple' );
	} );

	it( 'describes the remove button with a consumer aria-labelledby', () => {
		render(
			<>
				<span id="chip-name">Apple</span>
				<Combobox.Root< Item, true >
					items={ ITEMS }
					multiple
					defaultValue={ [ ITEMS[ 0 ] ] }
				>
					<Combobox.Chips>
						<Combobox.Value>
							{ ( value: Item[] ) => (
								<>
									{ value.map( ( item ) => (
										<Combobox.ChipWithRemove
											key={ item.id }
											aria-labelledby="chip-name"
										>
											{ item.value }
										</Combobox.ChipWithRemove>
									) ) }
								</>
							) }
						</Combobox.Value>
					</Combobox.Chips>
				</Combobox.Root>
			</>
		);

		expect( screen.getByLabelText( 'Apple' ) ).toHaveAccessibleName(
			'Apple'
		);
		expect(
			screen.getByRole( 'button', { name: 'Remove' } )
		).toHaveAccessibleDescription( 'Apple' );
	} );

	it( 'describes ChipWithRemove with the Backspace or Delete hint by default', () => {
		render(
			<Combobox.Root< Item, true >
				items={ ITEMS }
				multiple
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
							</>
						) }
					</Combobox.Value>
				</Combobox.Chips>
			</Combobox.Root>
		);

		expect( screen.getByLabelText( 'Item 1' ) ).toHaveAccessibleDescription(
			'Press Backspace or Delete to remove.'
		);
	} );

	describe( 'when disabled', () => {
		it( 'disables the chip remove button', () => {
			renderDisabledMultiSelect();

			expect(
				screen.getByRole( 'button', { name: 'Remove' } )
			).toBeDisabled();
		} );

		it( 'hides the clear button from screen readers', () => {
			renderDisabledMultiSelect();

			expect(
				screen.queryByRole( 'button', { name: 'Clear' } )
			).not.toBeInTheDocument();
		} );
	} );
} );
