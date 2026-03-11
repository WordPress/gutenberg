import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Card from '../../card';
import * as CollapsibleCard from '../index';

describe( 'CollapsibleCard', () => {
	describe( 'basic behaviour', () => {
		it( 'forwards ref', () => {
			const rootRef = createRef< HTMLDivElement >();
			const headerRef = createRef< HTMLDivElement >();
			const contentRef = createRef< HTMLDivElement >();

			render(
				<CollapsibleCard.Root ref={ rootRef } defaultOpen>
					<CollapsibleCard.Header ref={ headerRef }>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content ref={ contentRef }>
						<p>Content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( headerRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( contentRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		it( 'renders header content', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Card heading</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect( screen.getByText( 'Card heading' ) ).toBeVisible();
		} );
	} );

	describe( 'collapsing', () => {
		it( 'hides content when collapsed (default)', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Hidden content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect(
				screen.queryByText( 'Hidden content' )
			).not.toBeInTheDocument();
		} );

		it( 'shows content when defaultOpen is true', () => {
			render(
				<CollapsibleCard.Root defaultOpen>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Visible content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect( screen.getByText( 'Visible content' ) ).toBeVisible();
		} );

		it( 'toggles content on trigger click', async () => {
			const user = userEvent.setup();

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Toggle content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect(
				screen.queryByText( 'Toggle content' )
			).not.toBeInTheDocument();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Expand or collapse card',
				} )
			);

			expect( screen.getByText( 'Toggle content' ) ).toBeVisible();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Expand or collapse card',
				} )
			);

			expect(
				screen.queryByText( 'Toggle content' )
			).not.toBeInTheDocument();
		} );

		it( 'toggles content when clicking the header area', async () => {
			const user = userEvent.setup();

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Header click test</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Header toggled content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect(
				screen.queryByText( 'Header toggled content' )
			).not.toBeInTheDocument();

			await user.click( screen.getByText( 'Header click test' ) );

			expect(
				screen.getByText( 'Header toggled content' )
			).toBeVisible();
		} );

		it( 'calls onOpenChange when toggled', async () => {
			const onOpenChange = jest.fn();
			const user = userEvent.setup();

			render(
				<CollapsibleCard.Root onOpenChange={ onOpenChange }>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			await user.click(
				screen.getByRole( 'button', {
					name: 'Expand or collapse card',
				} )
			);

			expect( onOpenChange.mock.calls[ 0 ][ 0 ] ).toBe( true );
		} );
	} );

	describe( 'disabled', () => {
		it( 'does not toggle when disabled', async () => {
			const user = userEvent.setup();

			render(
				<CollapsibleCard.Root defaultOpen disabled>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Should stay visible</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			expect( screen.getByText( 'Should stay visible' ) ).toBeVisible();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Expand or collapse card',
				} )
			);

			expect( screen.getByText( 'Should stay visible' ) ).toBeVisible();
		} );
	} );

	describe( 'trigger', () => {
		it( 'renders a toggle button', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Expand or collapse card',
				} )
			).toBeVisible();
		} );
	} );
} );
