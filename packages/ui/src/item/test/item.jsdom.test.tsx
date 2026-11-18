import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Badge } from '../../badge';
import { Button } from '../../button';
import * as Item from '../index';

describe( 'Item', () => {
	it( 'renders a row on its own, and a list item inside a group', () => {
		const { rerender } = render(
			<Item.LinkRow href="/zones">
				<Item.Label>Zones</Item.Label>
			</Item.LinkRow>
		);

		expect( screen.queryByRole( 'listitem' ) ).not.toBeInTheDocument();

		rerender(
			<Item.Group aria-label="Shipping">
				<Item.LinkRow href="/zones">
					<Item.Label>Zones</Item.Label>
				</Item.LinkRow>
			</Item.Group>
		);

		const list = screen.getByRole( 'list', { name: 'Shipping' } );
		expect( list.tagName ).toBe( 'UL' );
		expect( screen.getByRole( 'listitem' ) ).toBeInTheDocument();
	} );

	it( 'names the row by its label, and describes it with the description and meta', () => {
		render(
			<Item.LinkRow href="/card">
				<Item.Label>Card payments</Item.Label>
				<Item.Description>Accept cards at checkout.</Item.Description>
				<Item.Meta>
					<Badge intent="stable">Enabled</Badge>
				</Item.Meta>
			</Item.LinkRow>
		);

		// The control is empty and covers the row, so its name comes from
		// the label rendered beside it.
		const link = screen.getByRole( 'link', { name: 'Card payments' } );
		expect( link ).toHaveAccessibleDescription(
			'Accept cards at checkout. Enabled'
		);
	} );

	it( 'keeps a row control and its actions as separate targets', async () => {
		const open = vi.fn();
		const reset = vi.fn();
		render(
			<Item.ButtonRow onClick={ open }>
				<Item.Label>Background</Item.Label>
				<Item.Actions>
					<Button onClick={ reset }>Reset</Button>
				</Item.Actions>
			</Item.ButtonRow>
		);

		const row = screen.getByRole( 'button', { name: 'Background' } );
		const action = screen.getByRole( 'button', { name: /Reset/ } );

		// The row's control covers the row rather than wrapping it, so
		// nothing interactive is nested.
		expect( row ).not.toContainElement( action );

		await userEvent.click( action );
		expect( reset ).toHaveBeenCalledTimes( 1 );
		expect( open ).not.toHaveBeenCalled();

		await userEvent.click( row );
		expect( open ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'describes each action by the row it belongs to', () => {
		render(
			<Item.ContentRow>
				<Item.Label>Soft shadow</Item.Label>
				<Item.Description>Used on featured images.</Item.Description>
				<Item.Actions>
					<Button>Edit</Button>
				</Item.Actions>
			</Item.ContentRow>
		);

		expect(
			screen.getByRole( 'button', { name: 'Edit' } )
		).toHaveAccessibleDescription( 'Soft shadow Used on featured images.' );
	} );

	it( 'leaves a content row without a control of its own', () => {
		render(
			<Item.ContentRow>
				<Item.Label>Soft shadow</Item.Label>
			</Item.ContentRow>
		);

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'hides the media from assistive technology', () => {
		render(
			<Item.LinkRow href="/zones">
				<Item.Media>
					<span>Globe</span>
				</Item.Media>
				<Item.Label>Zones</Item.Label>
			</Item.LinkRow>
		);

		expect( screen.getByText( 'Globe' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'link' ) ).toHaveAccessibleName( 'Zones' );
	} );

	it( 'warns when a row shows a chevron next to its controls', () => {
		render(
			<Item.ButtonRow onClick={ () => {} }>
				<Item.Label>Background</Item.Label>
				<Item.Chevron />
				<Item.Actions>
					<Button>Reset</Button>
				</Item.Actions>
			</Item.ButtonRow>
		);

		expect( console ).toHaveWarned();
	} );
} );
