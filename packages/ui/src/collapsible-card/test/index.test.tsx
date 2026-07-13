import { render, screen, within } from '@testing-library/react';
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

			expect( screen.getByText( 'Hidden content' ) ).not.toBeVisible();
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

			expect( screen.getByText( 'Toggle content' ) ).not.toBeVisible();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Title',
					expanded: false,
				} )
			);

			expect( screen.getByText( 'Toggle content' ) ).toBeVisible();

			await user.click(
				screen.getByRole( 'button', {
					name: 'Title',
					expanded: true,
				} )
			);

			expect( screen.getByText( 'Toggle content' ) ).not.toBeVisible();
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
					name: 'Title',
					expanded: false,
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
					name: 'Title',
					expanded: true,
				} )
			);

			expect( screen.getByText( 'Should stay visible' ) ).toBeVisible();
		} );
	} );

	describe( 'trigger', () => {
		it( 'renders the header as a toggle button', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect(
				screen.getByRole( 'button', {
					name: 'Title',
					expanded: false,
				} )
			).toBeVisible();
		} );
	} );

	describe( 'header wrapper', () => {
		it( 'does not contribute a heading to the document outline by default', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect(
				screen.queryByRole( 'heading', { name: 'Title' } )
			).not.toBeInTheDocument();
			expect(
				screen.getByRole( 'button', { name: 'Title' } )
			).toBeVisible();
		} );

		it( 'wraps the trigger in a heading via `render`', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header render={ <h2 /> }>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const heading = screen.getByRole( 'heading', {
				level: 2,
				name: 'Title',
			} );
			expect( heading ).toBeVisible();
			expect(
				within( heading ).getByRole( 'button', { name: 'Title' } )
			).toBeVisible();
		} );

		it( 'forwards `className` and other props to the outer wrapper', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header
						className="custom-header"
						data-testid="header"
					>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const wrapper = screen.getByTestId( 'header' );
			expect( wrapper ).toHaveClass( 'custom-header' );
			// The forwarded attributes land on the outer wrapper, not the
			// inner button trigger.
			expect(
				within( wrapper ).getByRole( 'button', { name: 'Title' } )
			).not.toHaveAttribute( 'data-testid' );
		} );
	} );

	describe( 'HeaderDescription', () => {
		it( 'sets aria-describedby on the trigger pointing to the description', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
						<CollapsibleCard.HeaderDescription data-testid="desc">
							3 errors
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button', {
				name: 'Settings',
			} );
			const descriptionElement = screen.getByTestId( 'desc' );

			expect( descriptionElement ).toHaveAttribute( 'id' );
			expect( trigger ).toHaveAttribute(
				'aria-describedby',
				descriptionElement.id
			);
		} );

		it( 'marks the description content as aria-hidden', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
						<CollapsibleCard.HeaderDescription data-testid="desc">
							<span>Status: OK</span>
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const descriptionWrapper = screen.getByTestId( 'desc' );
			expect( descriptionWrapper ).toHaveAttribute(
				'aria-hidden',
				'true'
			);
		} );

		it( 'does not set aria-describedby when HeaderDescription is absent', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button', { name: 'Title' } );
			expect( trigger ).not.toHaveAttribute( 'aria-describedby' );
		} );

		it( 'forwards ref on HeaderDescription', () => {
			const descRef = createRef< HTMLDivElement >();

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
						<CollapsibleCard.HeaderDescription ref={ descRef }>
							Description
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect( descRef.current ).toBeInstanceOf( HTMLDivElement );
		} );

		it( 'renders description content visually', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
						<CollapsibleCard.HeaderDescription>
							Badge content
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			expect( screen.getByText( 'Badge content' ) ).toBeVisible();
		} );
	} );
} );
