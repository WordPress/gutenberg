import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import * as Autocomplete from '../index';

const ITEMS = [
	{ id: '1', value: 'Item 1' },
	{ id: '2', value: 'Item 2' },
	{ id: '3', value: 'Item 3' },
];

function renderDisabledAutocompleteWithClear() {
	return render(
		<Autocomplete.Root items={ ITEMS } disabled defaultValue="Item 1">
			<Autocomplete.Input placeholder="Search" />
			<Autocomplete.Clear />
		</Autocomplete.Root>
	);
}

describe( 'Autocomplete', () => {
	describe( 'when disabled', () => {
		it( 'hides the clear button from screen readers', () => {
			renderDisabledAutocompleteWithClear();

			expect(
				screen.queryByRole( 'button', { name: 'Clear' } )
			).not.toBeInTheDocument();
		} );
	} );

	describe( 'grid rows', () => {
		const GRID_ITEMS = [
			{
				value: 'emojis',
				label: 'Emojis',
				items: [
					{ value: 'grinning', emoji: '😀', label: 'grinning face' },
					{ value: 'smile', emoji: '😊', label: 'smiling face' },
				],
			},
		];

		it( 'throws outside Autocomplete.Root', () => {
			expect( () => render( <Autocomplete.Row /> ) ).toThrow(
				'Autocomplete.Row: Missing parent <Autocomplete.Root grid>. Render <Autocomplete.Row> inside <Autocomplete.Root grid>.'
			);
			expect( console ).toHaveErrored();
		} );

		it( 'throws when Autocomplete.Root does not enable grid mode', () => {
			expect( () =>
				render(
					<Autocomplete.Root items={ GRID_ITEMS }>
						<Autocomplete.Row />
					</Autocomplete.Root>
				)
			).toThrow(
				'Autocomplete.Row: Missing parent <Autocomplete.Root grid>. Render <Autocomplete.Row> inside <Autocomplete.Root grid>.'
			);
			expect( console ).toHaveErrored();
		} );

		it( 'forwards ref', async () => {
			const rowRef = createRef< HTMLDivElement >();

			render(
				<Autocomplete.Root items={ GRID_ITEMS } grid inline open>
					<Autocomplete.List>
						{ ( group: ( typeof GRID_ITEMS )[ number ] ) => (
							<Autocomplete.Group
								key={ group.value }
								items={ group.items }
							>
								<Autocomplete.Row ref={ rowRef }>
									{ group.items.map( ( item ) => (
										<Autocomplete.Item
											key={ item.value }
											value={ item }
										>
											{ item.emoji }
										</Autocomplete.Item>
									) ) }
								</Autocomplete.Row>
							</Autocomplete.Group>
						) }
					</Autocomplete.List>
				</Autocomplete.Root>
			);

			await waitFor( () => {
				expect( rowRef.current ).toBeInstanceOf( HTMLDivElement );
			} );
		} );

		it( 'uses grid semantics for grouped items', async () => {
			render(
				<Autocomplete.Root items={ GRID_ITEMS } grid inline open>
					<Autocomplete.List>
						{ ( group: ( typeof GRID_ITEMS )[ number ] ) => (
							<Autocomplete.Group
								key={ group.value }
								items={ group.items }
							>
								<Autocomplete.Row>
									{ group.items.map( ( item ) => (
										<Autocomplete.Item
											key={ item.value }
											value={ item }
										>
											{ item.emoji }
										</Autocomplete.Item>
									) ) }
								</Autocomplete.Row>
							</Autocomplete.Group>
						) }
					</Autocomplete.List>
				</Autocomplete.Root>
			);

			expect( await screen.findByRole( 'grid' ) ).not.toHaveAttribute(
				'aria-orientation'
			);
			expect( screen.getAllByRole( 'rowgroup' ) ).toHaveLength(
				GRID_ITEMS.length
			);
		} );
	} );
} );
