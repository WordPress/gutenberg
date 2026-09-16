import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
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
									{ item.value }
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

		const chip = screen.getByText( ( _content, element ) => {
			return (
				element instanceof HTMLElement &&
				element.tagName === 'DIV' &&
				element.hasAttribute( 'aria-describedby' ) &&
				( element.textContent ?? '' ).includes( 'Item 1' )
			);
		} );

		expect( chip ).toHaveAccessibleDescription(
			'Press Backspace or Delete to remove.'
		);
		expect( chip ).not.toHaveAttribute( 'aria-description' );
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
