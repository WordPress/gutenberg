import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlotFillProvider } from '@wordpress/components';
import {
	BlockOptionsMenuItem,
	BlockOptionsMenuItemFill,
	BlockOptionsMenuItemsSlot,
} from '../options-menu-item';
import type { BlockOptionsMenuItemProps } from '../options-menu-item';

function ItemList( { clientIds }: { clientIds: string[] } ) {
	return (
		<BlockOptionsMenuItemsSlot clientIds={ clientIds }>
			{ ( items: BlockOptionsMenuItemProps[] ) => (
				<ul>
					{ items.map( ( item ) => (
						<li key={ item.name }>
							{ item.group }: { item.label }
						</li>
					) ) }
				</ul>
			) }
		</BlockOptionsMenuItemsSlot>
	);
}

describe( 'BlockOptionsMenuItemsSlot', () => {
	it( 'reads the items of the fills, including ones in fragments', () => {
		render(
			<SlotFillProvider>
				<ItemList clientIds={ [ 'a' ] } />
				<BlockOptionsMenuItemFill>
					<BlockOptionsMenuItem
						group="actions"
						name="first"
						label="Create pattern"
						onClick={ () => {} }
					/>
				</BlockOptionsMenuItemFill>
				<BlockOptionsMenuItemFill>
					<>
						<BlockOptionsMenuItem
							group="more"
							name="second"
							label="Add note"
							onClick={ () => {} }
						/>
						<BlockOptionsMenuItem
							group="insert"
							name="third"
							label="Footnote"
							onClick={ () => {} }
						/>
					</>
				</BlockOptionsMenuItemFill>
			</SlotFillProvider>
		);

		expect(
			screen
				.getAllByRole( 'listitem' )
				.map( ( item ) => item.textContent )
		).toEqual( [
			'actions: Create pattern',
			'more: Add note',
			'insert: Footnote',
		] );
	} );

	it( 'passes the client IDs to function fills', () => {
		render(
			<SlotFillProvider>
				<ItemList clientIds={ [ 'a', 'b' ] } />
				<BlockOptionsMenuItemFill>
					{ ( { clientIds } ) =>
						clientIds.length === 1 ? (
							<BlockOptionsMenuItem
								group="more"
								name="single"
								label="Single block only"
								onClick={ () => {} }
							/>
						) : (
							<BlockOptionsMenuItem
								group="more"
								name="multiple"
								label={ `${ clientIds.length } blocks` }
								onClick={ () => {} }
							/>
						)
					}
				</BlockOptionsMenuItemFill>
			</SlotFillProvider>
		);

		expect( screen.getByRole( 'listitem' ) ).toHaveTextContent(
			'more: 2 blocks'
		);
	} );

	it( 'ignores other elements in fills', () => {
		render(
			<SlotFillProvider>
				<ItemList clientIds={ [ 'a' ] } />
				<BlockOptionsMenuItemFill>
					<span>Not an item</span>
				</BlockOptionsMenuItemFill>
			</SlotFillProvider>
		);

		expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();
	} );
} );
