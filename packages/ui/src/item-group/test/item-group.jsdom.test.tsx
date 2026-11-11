import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as ItemGroup from '../index';

describe( 'ItemGroup', () => {
	it( 'keeps list semantics so items are counted as one set', () => {
		render(
			<ItemGroup.Root aria-label="Shipping">
				<ItemGroup.Item title="Zones" href="/zones" />
				<ItemGroup.Item title="Classes" href="/classes" />
			</ItemGroup.Root>
		);

		const list = screen.getByRole( 'list', { name: 'Shipping' } );
		expect( list.tagName ).toBe( 'UL' );
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 2 );
	} );

	it( 'renders an anchor for href and a button for onClick', async () => {
		const onClick = vi.fn();
		render(
			<ItemGroup.Root>
				<ItemGroup.Item title="Zones" href="/zones" />
				<ItemGroup.Item title="Classes" onClick={ onClick } />
				<ItemGroup.Item title="Static" />
			</ItemGroup.Root>
		);

		expect( screen.getByRole( 'link', { name: 'Zones' } ) ).toHaveAttribute(
			'href',
			'/zones'
		);

		const button = screen.getByRole( 'button', { name: 'Classes' } );
		await userEvent.click( button );
		expect( onClick ).toHaveBeenCalledTimes( 1 );

		// A row with neither is content, not a control.
		expect(
			screen.queryByRole( 'link', { name: 'Static' } )
		).not.toBeInTheDocument();
		expect(
			screen.queryByRole( 'button', { name: 'Static' } )
		).not.toBeInTheDocument();
	} );

	it( 'names an activatable item by its title alone, and describes it with the description and badges', () => {
		render(
			<ItemGroup.Root>
				<ItemGroup.Item
					title="Card payments"
					description="Accept cards at checkout."
					badges={ <Badge intent="stable">Enabled</Badge> }
					href="/card"
				/>
			</ItemGroup.Root>
		);

		// The name is the destination, matching the heading of the screen it
		// opens — not the whole row read out.
		const link = screen.getByRole( 'link', { name: 'Card payments' } );
		expect( link ).toHaveAccessibleDescription(
			'Accept cards at checkout. Enabled'
		);
	} );

	it( 'describes each action by the item it belongs to', () => {
		render(
			<ItemGroup.Root>
				<ItemGroup.Item
					title="Export settings"
					description="Download your configuration."
					actions={ <Button>Export</Button> }
				/>
			</ItemGroup.Root>
		);

		expect(
			screen.getByRole( 'button', { name: 'Export' } )
		).toHaveAccessibleDescription(
			'Export settings Download your configuration.'
		);
	} );

	it( 'keeps an action out of the item control, so both stay reachable', async () => {
		const onRowClick = vi.fn();
		const onActionClick = vi.fn();
		render(
			<ItemGroup.Root>
				<ItemGroup.Item
					title="Color"
					onClick={ onRowClick }
					actions={ <Button onClick={ onActionClick }>Reset</Button> }
				/>
			</ItemGroup.Root>
		);

		const action = screen.getByRole( 'button', { name: /Reset/ } );
		const row = screen.getByRole( 'button', { name: 'Color' } );

		// Invalid markup would put one inside the other.
		expect( row ).not.toContainElement( action );

		await userEvent.click( action );
		expect( onActionClick ).toHaveBeenCalledTimes( 1 );
		expect( onRowClick ).not.toHaveBeenCalled();
	} );

	it( 'hides the decoration from assistive technology', () => {
		render(
			<ItemGroup.Root>
				<ItemGroup.Item
					title="Zones"
					href="/zones"
					decoration={ <span>Globe</span> }
				/>
			</ItemGroup.Root>
		);

		// The decoration renders text, and none of it reaches the name.
		expect( screen.getByText( 'Globe' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAccessibleName( 'Zones' );
	} );

	/*
	 * The glyph is hidden from assistive technology by design, so it has no
	 * accessible handle and the DOM is the only way to assert on it.
	 */
	/* eslint-disable testing-library/no-container, testing-library/no-node-access */
	it( 'shows a trailing glyph only for an item that can be activated', () => {
		const { container } = render(
			<ItemGroup.Root>
				<ItemGroup.Item title="Static" />
				<ItemGroup.Item title="Zones" href="/zones" />
			</ItemGroup.Root>
		);

		const [ staticItem, linkItem ] = screen.getAllByRole( 'listitem' );
		expect( staticItem.querySelector( 'svg' ) ).toBeNull();
		expect( linkItem.querySelector( 'svg' ) ).not.toBeNull();
		expect( container.querySelectorAll( 'svg' ) ).toHaveLength( 1 );
	} );

	it( 'omits the glyph when navigation is none', () => {
		const { container } = render(
			<ItemGroup.Root>
				<ItemGroup.Item title="Color" href="/color" navigation="none" />
			</ItemGroup.Root>
		);

		expect( container.querySelector( 'svg' ) ).toBeNull();
	} );
	/* eslint-enable testing-library/no-container, testing-library/no-node-access */

	it( 'preserves an action’s own description', () => {
		render(
			<ItemGroup.Root>
				<ItemGroup.Item
					title="Export settings"
					actions={
						<>
							<span id="hint">Takes a moment</span>
							<Button aria-describedby="hint">Export</Button>
						</>
					}
				/>
			</ItemGroup.Root>
		);

		expect(
			screen.getByRole( 'button', { name: 'Export' } )
		).toHaveAccessibleDescription( 'Takes a moment Export settings' );
	} );
} );
