import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Button } from '../../button';
import * as Card from '../../card';
import { ThemeProvider } from '../../utils/theme-provider';
import * as Item from '../index';

function elementAtCenterOf( element: Element ) {
	const { left, top, width, height } = element.getBoundingClientRect();
	return document.elementFromPoint( left + width / 2, top + height / 2 );
}

describe( 'Item layout', () => {
	it( 'makes the whole row the target of its button, and keeps the actions on top', async () => {
		await render(
			<Item.Group aria-label="Background">
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Label>Color</Item.Label>
					<Item.Description>
						The color behind the content.
					</Item.Description>
					<Item.Actions>
						<Button size="compact">Reset background color</Button>
					</Item.Actions>
				</Item.ButtonRow>
			</Item.Group>
		);

		const row = screen.getByRole( 'button', { name: 'Color' } );
		const action = screen.getByRole( 'button', {
			name: 'Reset background color',
		} );

		// The button of the row covers the static parts of the row.
		expect(
			elementAtCenterOf(
				screen.getByText( 'The color behind the content.' )
			)
		).toBe( row );
		// The action is above the button of the row, not under it.
		expect( action ).toContainElement(
			elementAtCenterOf( action ) as HTMLElement
		);

		const rowRect = row.getBoundingClientRect();
		const listRect = screen.getByRole( 'listitem' ).getBoundingClientRect();
		expect( rowRect.width ).toBe( listRect.width );
		expect( rowRect.height ).toBe( listRect.height );
	} );

	it( 'leaves the space between two actions to the control of the row', async () => {
		await render(
			<Item.ButtonRow onClick={ () => {} }>
				<Item.Label>Soft shadow</Item.Label>
				<Item.Actions>
					<Button size="compact">Edit soft shadow</Button>
					<Button size="compact">Remove soft shadow</Button>
				</Item.Actions>
			</Item.ButtonRow>
		);

		const edit = screen
			.getByRole( 'button', { name: 'Edit soft shadow' } )
			.getBoundingClientRect();
		const remove = screen
			.getByRole( 'button', { name: 'Remove soft shadow' } )
			.getBoundingClientRect();

		expect(
			document.elementFromPoint(
				( edit.right + remove.left ) / 2,
				edit.top + edit.height / 2
			)
		).toBe( screen.getByRole( 'button', { name: 'Soft shadow' } ) );
	} );

	it( 'keeps static parts that create their own stacking context under the control of the row', async () => {
		await render(
			<div dir="rtl">
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Media>
						<span
							data-testid="media"
							style={ {
								display: 'inline-block',
								width: 32,
								height: 32,
								position: 'relative',
								transform: 'translateZ(0)',
								zIndex: 2,
							} }
						/>
					</Item.Media>
					<Item.Label>Color</Item.Label>
					<Item.Chevron data-testid="chevron" />
				</Item.ButtonRow>
			</div>
		);

		const row = screen.getByRole( 'button', { name: 'Color' } );

		// The chevron is mirrored with a transform in right-to-left, and
		// the media holds a positioned element.
		expect( elementAtCenterOf( screen.getByTestId( 'chevron' ) ) ).toBe(
			row
		);
		expect( elementAtCenterOf( screen.getByTestId( 'media' ) ) ).toBe(
			row
		);
	} );

	it( 'wraps a long label without a space, so it does not run under the actions', async () => {
		await render(
			<div style={ { width: 240 } }>
				<Item.ContentRow>
					<Item.Label>
						featuredimagefortheannualreport2026final.png
					</Item.Label>
					<Item.Actions>
						<Button size="compact">Remove image</Button>
					</Item.Actions>
				</Item.ContentRow>
			</div>
		);

		// The text, not the box of the label: overflowing text paints
		// outside the box.
		const range = document.createRange();
		range.selectNodeContents(
			screen.getByText( 'featuredimagefortheannualreport2026final.png' )
		);
		const label = range.getBoundingClientRect();
		const action = screen
			.getByRole( 'button', { name: 'Remove image' } )
			.getBoundingClientRect();

		expect( label.right ).toBeLessThanOrEqual( action.left );
	} );

	it( 'wraps a long meta value, so the actions stay in the row', async () => {
		await render(
			<div style={ { width: 320 } }>
				<Item.ContentRow data-testid="row">
					<Item.Label>Webhook</Item.Label>
					<Item.Meta>
						https://example.com/hooks/abcdefghijklmnopqrstuvwxyz0123456789
					</Item.Meta>
					<Item.Actions>
						<Button size="compact">Remove webhook</Button>
					</Item.Actions>
				</Item.ContentRow>
			</div>
		);

		const row = screen.getByTestId( 'row' ).getBoundingClientRect();
		const label = screen.getByText( 'Webhook' ).getBoundingClientRect();
		const action = screen
			.getByRole( 'button', { name: 'Remove webhook' } )
			.getBoundingClientRect();

		expect( action.right ).toBeLessThanOrEqual( row.right );
		// The label keeps room for its own text.
		expect( label.width ).toBeGreaterThan( 40 );
	} );

	it( 'styles a row by its own control, not by a row nested in its actions', async () => {
		await render(
			<>
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Label>Plain</Item.Label>
				</Item.ButtonRow>
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Label>Outer</Item.Label>
					<Item.Actions>
						{ /* A popup mounted in the subtree of the row. */ }
						<div>
							<Item.ButtonRow onClick={ () => {} } disabled>
								<Item.Label>Inner</Item.Label>
								<Item.Description>
									Unavailable.
								</Item.Description>
							</Item.ButtonRow>
						</div>
					</Item.Actions>
				</Item.ButtonRow>
			</>
		);

		const plain = getComputedStyle( screen.getByText( 'Plain' ) );
		const outer = getComputedStyle( screen.getByText( 'Outer' ) );

		expect( outer.color ).toBe( plain.color );
		expect( outer.gridRowEnd ).toBe( plain.gridRowEnd );
	} );

	it( 'keeps the browser cursor on a link row, and the control cursor on a button row', async () => {
		await render(
			<ThemeProvider cursor={ { control: 'default' } }>
				<Item.LinkRow href="#zones">
					<Item.Label>Zones</Item.Label>
				</Item.LinkRow>
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Label>Recalculate</Item.Label>
				</Item.ButtonRow>
			</ThemeProvider>
		);

		expect(
			getComputedStyle( screen.getByRole( 'link', { name: 'Zones' } ) )
				.cursor
		).toBe( 'pointer' );
		expect(
			getComputedStyle(
				screen.getByRole( 'button', { name: 'Recalculate' } )
			).cursor
		).toBe( 'default' );
	} );

	it( 'rounds the control of the first and of the last row to follow the frame', async () => {
		await render(
			<Item.Group aria-label="Shipping">
				<Item.LinkRow href="#zones">
					<Item.Label>Zones</Item.Label>
				</Item.LinkRow>
				<Item.ButtonRow onClick={ () => {} }>
					<Item.Label>Recalculate</Item.Label>
				</Item.ButtonRow>
			</Item.Group>
		);

		// The focus ring follows these radii. A square ring would be
		// clipped by the rounded corners of the frame.
		const first = getComputedStyle(
			screen.getByRole( 'link', { name: 'Zones' } )
		);
		expect( first.borderStartStartRadius ).not.toBe( '0px' );
		expect( first.borderStartEndRadius ).not.toBe( '0px' );
		expect( first.borderEndStartRadius ).toBe( '0px' );
		expect( first.borderEndEndRadius ).toBe( '0px' );

		const last = getComputedStyle(
			screen.getByRole( 'button', { name: 'Recalculate' } )
		);
		expect( last.borderStartStartRadius ).toBe( '0px' );
		expect( last.borderStartEndRadius ).toBe( '0px' );
		expect( last.borderEndStartRadius ).not.toBe( '0px' );
		expect( last.borderEndEndRadius ).not.toBe( '0px' );
	} );

	it( 'leaves the frame to the card inside `Card.FullBleed`, and keeps a line above the first row', async () => {
		await render(
			<>
				<Item.Group aria-label="On its own">
					<Item.LinkRow href="#zones">
						<Item.Label>Zones</Item.Label>
					</Item.LinkRow>
				</Item.Group>
				<Card.Root>
					<Card.Header>
						<Card.Title>Payment gateways</Card.Title>
					</Card.Header>
					<Card.Content>
						<Card.FullBleed>
							<Item.Group aria-label="In a card">
								<Item.LinkRow href="#card">
									<Item.Label>Card payments</Item.Label>
								</Item.LinkRow>
							</Item.Group>
						</Card.FullBleed>
					</Card.Content>
				</Card.Root>
			</>
		);

		const onItsOwn = getComputedStyle(
			screen.getByRole( 'list', { name: 'On its own' } )
		);
		expect( onItsOwn.borderBlockStartWidth ).not.toBe( '0px' );
		expect( onItsOwn.borderInlineStartWidth ).not.toBe( '0px' );
		expect( onItsOwn.borderBlockEndWidth ).not.toBe( '0px' );
		expect( onItsOwn.borderStartStartRadius ).not.toBe( '0px' );

		const inCard = getComputedStyle(
			screen.getByRole( 'list', { name: 'In a card' } )
		);
		// The line that separates the rows from the card header.
		expect( inCard.borderBlockStartWidth ).not.toBe( '0px' );
		expect( inCard.borderInlineStartWidth ).toBe( '0px' );
		expect( inCard.borderBlockEndWidth ).toBe( '0px' );
		expect( inCard.borderStartStartRadius ).toBe( '0px' );
		const link = getComputedStyle(
			screen.getByRole( 'link', { name: 'Card payments' } )
		);
		// The top of the row is under the card header, in the middle of
		// the card.
		expect( link.borderStartStartRadius ).toBe( '0px' );
		// The bottom of the row is flush with the bottom of the card. It
		// follows the corners of the card, so that the card does not clip
		// the focus ring at an angle.
		expect( link.borderEndStartRadius ).not.toBe( '0px' );
		expect( link.borderEndEndRadius ).not.toBe( '0px' );
	} );

	it( 'draws a frame around a row outside a group', async () => {
		await render(
			<Item.ContentRow data-testid="row">
				<Item.Label>Billing history</Item.Label>
			</Item.ContentRow>
		);

		expect(
			getComputedStyle( screen.getByTestId( 'row' ) ).borderTopWidth
		).not.toBe( '0px' );
	} );

	it( 'draws one frame around a joined group, and one around each row of a detached group', async () => {
		await render(
			<>
				<Item.Group aria-label="Joined">
					<Item.ContentRow>
						<Item.Label>First</Item.Label>
					</Item.ContentRow>
				</Item.Group>
				<Item.Group aria-label="Detached" variant="detached">
					<Item.ContentRow>
						<Item.Label>Second</Item.Label>
					</Item.ContentRow>
				</Item.Group>
			</>
		);

		const joined = screen.getByRole( 'list', { name: 'Joined' } );
		const detached = screen.getByRole( 'list', { name: 'Detached' } );
		const [ joinedItem, detachedItem ] = screen.getAllByRole( 'listitem' );

		expect( getComputedStyle( joined ).borderInlineStartWidth ).not.toBe(
			'0px'
		);
		expect( getComputedStyle( joinedItem ).borderInlineStartWidth ).toBe(
			'0px'
		);
		expect( getComputedStyle( detached ).borderInlineStartWidth ).toBe(
			'0px'
		);
		expect(
			getComputedStyle( detachedItem ).borderInlineStartWidth
		).not.toBe( '0px' );
	} );
} );
