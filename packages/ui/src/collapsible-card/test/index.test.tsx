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
		it( 'combines multiple descriptions into the trigger accessible description', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
						<CollapsibleCard.HeaderDescription>
							3 errors
						</CollapsibleCard.HeaderDescription>
						<CollapsibleCard.HeaderDescription>
							Requires attention
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
					<CollapsibleCard.Content>
						<p>Content</p>
					</CollapsibleCard.Content>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button' );

			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'3 errors Requires attention'
			);
		} );

		it( 'keeps explicit IDs while combining trigger accessible descriptions', () => {
			const errorsDescriptionId = 'errors-description';
			const attentionDescriptionId = 'attention-description';

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
						<CollapsibleCard.HeaderDescription
							id={ errorsDescriptionId }
						>
							3 errors
						</CollapsibleCard.HeaderDescription>
						<CollapsibleCard.HeaderDescription
							id={ attentionDescriptionId }
						>
							Requires attention
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button' );
			expect( screen.getByText( '3 errors' ) ).toHaveAttribute(
				'id',
				errorsDescriptionId
			);
			expect( screen.getByText( 'Requires attention' ) ).toHaveAttribute(
				'id',
				attentionDescriptionId
			);
			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'3 errors Requires attention'
			);
		} );

		it( 'applies an explicit accessible description only to the header trigger', () => {
			const existingDescriptionId = 'existing-description';

			render(
				<>
					<p id={ existingDescriptionId }>Existing description</p>
					<CollapsibleCard.Root>
						<CollapsibleCard.Header
							render={ <h2 /> }
							aria-describedby={ existingDescriptionId }
						>
							<Card.Title>Settings</Card.Title>
							<CollapsibleCard.HeaderDescription>
								3 errors
							</CollapsibleCard.HeaderDescription>
							<CollapsibleCard.HeaderDescription>
								Requires attention
							</CollapsibleCard.HeaderDescription>
						</CollapsibleCard.Header>
					</CollapsibleCard.Root>
				</>
			);

			const trigger = screen.getByRole( 'button' );
			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'Existing description 3 errors Requires attention'
			);
			expect(
				screen.getByRole( 'heading' )
			).not.toHaveAccessibleDescription();
		} );

		it( 'deduplicates explicit and registered accessible-description IDs', () => {
			const descriptionId = 'status';

			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header aria-describedby={ descriptionId }>
						<Card.Title>Settings</Card.Title>
						<CollapsibleCard.HeaderDescription id={ descriptionId }>
							3 errors
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button' );
			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription( '3 errors' );
		} );

		it( 'keeps descriptions in visual order when a conditional description remounts', () => {
			const getCard = ( showFirstDescription: boolean ) => (
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Settings</Card.Title>
						{ showFirstDescription && (
							<CollapsibleCard.HeaderDescription>
								3 errors
							</CollapsibleCard.HeaderDescription>
						) }
						<CollapsibleCard.HeaderDescription>
							Requires attention
						</CollapsibleCard.HeaderDescription>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const { rerender } = render( getCard( true ) );
			const trigger = screen.getByRole( 'button' );
			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'3 errors Requires attention'
			);

			rerender( getCard( false ) );

			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'Requires attention'
			);

			rerender( getCard( true ) );

			expect( trigger ).toHaveAccessibleName( 'Settings' );
			expect( trigger ).toHaveAccessibleDescription(
				'3 errors Requires attention'
			);
		} );

		it( 'throws in development when rendered outside CollapsibleCard.Header', () => {
			// React logs render errors before rethrowing them.
			// eslint-disable-next-line no-console
			const originalConsoleError = console.error;
			// eslint-disable-next-line no-console
			console.error = jest.fn();

			try {
				expect( () =>
					render(
						<CollapsibleCard.HeaderDescription>
							Description
						</CollapsibleCard.HeaderDescription>
					)
				).toThrow(
					'CollapsibleCard.HeaderDescription: Missing parent <CollapsibleCard.Header>. ' +
						'Render <CollapsibleCard.HeaderDescription> inside <CollapsibleCard.Header>.'
				);
			} finally {
				// eslint-disable-next-line no-console
				console.error = originalConsoleError;
			}
		} );

		it( 'has no accessible description when HeaderDescription is absent', () => {
			render(
				<CollapsibleCard.Root>
					<CollapsibleCard.Header>
						<Card.Title>Title</Card.Title>
					</CollapsibleCard.Header>
				</CollapsibleCard.Root>
			);

			const trigger = screen.getByRole( 'button' );
			expect( trigger ).toHaveAccessibleName( 'Title' );
			expect( trigger ).not.toHaveAccessibleDescription();
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
