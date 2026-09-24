import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { createRef } from '@wordpress/element';
import type { ComponentType, ReactNode } from 'react';
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
	it( 'supports custom item text elements and forwards their refs', () => {
		const labelRef = createRef< HTMLSpanElement >();
		const descriptionRef = createRef< HTMLSpanElement >();

		render(
			<Autocomplete.Root items={ [ 'Apple' ] } inline open>
				<Autocomplete.List>
					<Autocomplete.Item value="Apple">
						<Autocomplete.ItemLabel
							ref={ labelRef }
							render={ <h2 /> }
						>
							Apple
						</Autocomplete.ItemLabel>
						<Autocomplete.ItemDescription
							ref={ descriptionRef }
							render={ <small /> }
						>
							Fresh fruit.
						</Autocomplete.ItemDescription>
					</Autocomplete.Item>
				</Autocomplete.List>
			</Autocomplete.Root>
		);

		expect( labelRef.current?.tagName ).toBe( 'H2' );
		expect( descriptionRef.current?.tagName ).toBe( 'SMALL' );
	} );

	it( 'uses the item label as its accessible name and describes it in order', () => {
		const item = { value: 'apple', label: 'Apple' };

		render(
			<Autocomplete.Root items={ [ item ] } inline open>
				<Autocomplete.List>
					<Autocomplete.Item value={ item }>
						<Autocomplete.ItemLabel>Apple</Autocomplete.ItemLabel>
						<Autocomplete.ItemDescription>
							Fresh fruit.
						</Autocomplete.ItemDescription>
						<Autocomplete.ItemDescription>
							In stock.
						</Autocomplete.ItemDescription>
					</Autocomplete.Item>
				</Autocomplete.List>
			</Autocomplete.Root>
		);

		const option = screen.getByRole( 'option', { name: 'Apple' } );
		expect( option ).toHaveAccessibleDescription(
			'Fresh fruit. In stock.'
		);
	} );

	it( 'requires an ItemLabel as the first direct child', () => {
		const InvalidItem = Autocomplete.Item as ComponentType< {
			value: string;
			children?: ReactNode;
		} >;

		expect( () =>
			render(
				<Autocomplete.Root items={ [ 'Apple' ] } inline open>
					<Autocomplete.List>
						<InvalidItem value="Apple">Apple</InvalidItem>
					</Autocomplete.List>
				</Autocomplete.Root>
			)
		).toThrow( 'Autocomplete.ItemLabel must be the first direct child' );
		expect( console ).toHaveErrored();
	} );

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
											<Autocomplete.ItemLabel>
												{ item.emoji }
											</Autocomplete.ItemLabel>
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
											<Autocomplete.ItemLabel>
												{ item.emoji }
											</Autocomplete.ItemLabel>
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
