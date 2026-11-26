import { describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
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
		expect( within( list ).getByRole( 'listitem' ) ).toBeInTheDocument();
	} );

	it( 'keeps a detached group one list', () => {
		render(
			<Item.Group aria-label="Connectors" variant="detached">
				<Item.ContentRow>
					<Item.Label>Akismet</Item.Label>
				</Item.ContentRow>
				<Item.ContentRow>
					<Item.Label>Anthropic</Item.Label>
				</Item.ContentRow>
			</Item.Group>
		);

		const list = screen.getByRole( 'list', { name: 'Connectors' } );
		expect( within( list ).getAllByRole( 'listitem' ) ).toHaveLength( 2 );
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

	it( 'exposes the label of a link or button row only as the name of its control', () => {
		render(
			<Item.ButtonRow onClick={ () => {} }>
				<Item.Label>Export presets</Item.Label>
				<Item.Description>Download the presets.</Item.Description>
			</Item.ButtonRow>
		);

		expect(
			screen.getByRole( 'button', { name: 'Export presets' } )
		).toBeInTheDocument();
		// A screen reader would otherwise read the label a second time
		// after the button.
		expect( screen.getByText( 'Export presets' ) ).toHaveAttribute(
			'aria-hidden',
			'true'
		);
		// The description stays readable on its own.
		expect(
			screen.getByText( 'Download the presets.' )
		).not.toHaveAttribute( 'aria-hidden' );
	} );

	it( 'keeps the label of a content row readable', () => {
		render(
			<Item.ContentRow>
				<Item.Label>Soft shadow</Item.Label>
			</Item.ContentRow>
		);

		expect( screen.getByText( 'Soft shadow' ) ).not.toHaveAttribute(
			'aria-hidden'
		);
		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link' ) ).not.toBeInTheDocument();
	} );

	it( 'keeps a row control and its actions as separate targets', async () => {
		const user = userEvent.setup();
		const open = vi.fn();
		const reset = vi.fn();
		render(
			<Item.ButtonRow onClick={ open }>
				<Item.Label>Background</Item.Label>
				<Item.Actions>
					<Button onClick={ reset }>Reset background color</Button>
				</Item.Actions>
			</Item.ButtonRow>
		);

		const row = screen.getByRole( 'button', { name: 'Background' } );
		const action = screen.getByRole( 'button', {
			name: 'Reset background color',
		} );

		// The row's control covers the row; it does not wrap it. Nothing
		// interactive is nested.
		expect( row ).not.toContainElement( action );
		// The consumer names the action, and the row adds nothing to it.
		expect( action ).not.toHaveAccessibleDescription();

		await user.tab();
		expect( row ).toHaveFocus();
		await user.tab();
		expect( action ).toHaveFocus();

		await user.click( action );
		expect( reset ).toHaveBeenCalledTimes( 1 );
		expect( open ).not.toHaveBeenCalled();

		await user.click( row );
		expect( open ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'gives the ref, the render prop and other props to the control, not the class name', () => {
		const ref = createRef< HTMLAnchorElement >();
		render(
			<Item.LinkRow
				ref={ ref }
				className="my-row"
				data-testid="control"
				// eslint-disable-next-line jsx-a11y/anchor-has-content -- Named by `Item.Label`.
				render={ <a href="/from-render" data-router-link="" /> }
			>
				<Item.Label>Zones</Item.Label>
			</Item.LinkRow>
		);

		const link = screen.getByRole( 'link', { name: 'Zones' } );
		expect( ref.current ).toBe( link );
		expect( link ).toHaveAttribute( 'href', '/from-render' );
		expect( link ).toHaveAttribute( 'data-router-link' );
		expect( link ).toHaveAttribute( 'data-testid', 'control' );
		expect( link ).not.toHaveClass( 'my-row' );
	} );

	it.each( [
		[ 'openInNewTab', { openInNewTab: true } ],
		[ 'target="_blank"', { target: '_blank' } ],
	] )( 'says that a link row with %s opens in a new tab', ( _, props ) => {
		render(
			<Item.LinkRow href="https://wordpress.org" { ...props }>
				<Item.Label>Documentation</Item.Label>
				<Item.Chevron />
			</Item.LinkRow>
		);

		const link = screen.getByRole( 'link', {
			name: 'Documentation (opens in a new tab)',
		} );
		expect( link ).toHaveAttribute( 'target', '_blank' );
		expect( console ).not.toHaveWarned();
	} );

	it( 'warns when a link row that opens in a new tab has no chevron', () => {
		render(
			<Item.LinkRow href="https://wordpress.org" openInNewTab>
				<Item.Label>Documentation</Item.Label>
			</Item.LinkRow>
		);

		expect( console ).toHaveWarned();
	} );

	it( 'supports a disabled button row', async () => {
		const user = userEvent.setup();
		const open = vi.fn();
		render(
			<Item.ButtonRow onClick={ open } disabled>
				<Item.Label>Background</Item.Label>
			</Item.ButtonRow>
		);

		const row = screen.getByRole( 'button', { name: 'Background' } );
		// The button stays focusable, so it is disabled with ARIA.
		expect( row ).toHaveAttribute( 'aria-disabled', 'true' );

		await user.click( row );
		expect( open ).not.toHaveBeenCalled();
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

	it( 'warns when a link or button row has no label', () => {
		render(
			<Item.LinkRow href="/zones">
				<Item.Description>Regions you ship to.</Item.Description>
			</Item.LinkRow>
		);

		expect( console ).toHaveWarned();
	} );

	it( 'warns when a row shows a chevron next to its controls', () => {
		render(
			<Item.ButtonRow onClick={ () => {} }>
				<Item.Label>Background</Item.Label>
				<Item.Chevron />
				<Item.Actions>
					<Button>Reset background color</Button>
				</Item.Actions>
			</Item.ButtonRow>
		);

		expect( console ).toHaveWarned();
	} );
} );
