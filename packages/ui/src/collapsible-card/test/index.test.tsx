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

			const trigger = screen.getByRole( 'button', {
				name: 'Expand or collapse Title',
			} );

			expect(
				screen.queryByText( 'Toggle content' )
			).not.toBeInTheDocument();

			await user.click( trigger );

			expect( screen.getByText( 'Toggle content' ) ).toBeVisible();

			await user.click( trigger );

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
					name: 'Expand or collapse Title',
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
					name: 'Expand or collapse Title',
				} )
			);

			expect( screen.getByText( 'Should stay visible' ) ).toBeVisible();
		} );
	} );

	describe( 'trigger accessible label', () => {
		it( 'includes the Card.Title text in the trigger label', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Expand or collapse Settings',
				} )
			).toBeVisible();
		} );

		it( 'uses a static label that does not change when toggled', async () => {
			const user = userEvent.setup();

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Expand or collapse Settings',
			} );
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );

			await user.click( trigger );

			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
			expect( trigger ).toHaveAccessibleName(
				'Expand or collapse Settings'
			);
		} );

		it( 'falls back to header content when no Card.Title is used', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<span>Plain header text</span>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Expand or collapse Plain header text',
				} )
			).toBeVisible();
		} );

		it( 'produces unique labels for multiple cards', () => {
			render(
				<>
					<CollapsibleCard.Root>
						<CollapsibleCard.Header>
							<Card.Title>General</Card.Title>
						</CollapsibleCard.Header>
					</CollapsibleCard.Root>
					<CollapsibleCard.Root>
						<CollapsibleCard.Header>
							<Card.Title>Privacy</Card.Title>
						</CollapsibleCard.Header>
					</CollapsibleCard.Root>
				</>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Expand or collapse General',
				} )
			).toBeVisible();
			expect(
				screen.getByRole( 'button', {
					name: 'Expand or collapse Privacy',
				} )
			).toBeVisible();
		} );
	} );
} );
