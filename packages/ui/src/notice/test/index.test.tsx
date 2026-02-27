import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import * as Notice from '../index';

describe( 'Notice', () => {
	describe( 'basic behaviour', () => {
		it( 'forwards ref', () => {
			const rootRef = createRef< HTMLDivElement >();
			const titleRef = createRef< HTMLSpanElement >();
			const descriptionRef = createRef< HTMLDivElement >();
			const actionsRef = createRef< HTMLDivElement >();
			const actionButtonRef = createRef< HTMLButtonElement >();
			const actionLinkRef = createRef< HTMLAnchorElement >();
			const closeIconRef = createRef< HTMLButtonElement >();

			render(
				<Notice.Root ref={ rootRef }>
					<Notice.Title ref={ titleRef }>Title</Notice.Title>
					<Notice.Description ref={ descriptionRef }>
						Test
					</Notice.Description>
					<Notice.Actions ref={ actionsRef }>
						<Notice.ActionButton ref={ actionButtonRef }>
							Action Button
						</Notice.ActionButton>
						<Notice.ActionLink
							ref={ actionLinkRef }
							href="/example"
						>
							Action Link
						</Notice.ActionLink>
					</Notice.Actions>
					<Notice.CloseIcon ref={ closeIconRef } />
				</Notice.Root>
			);
			expect( rootRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( titleRef.current ).toBeInstanceOf( HTMLSpanElement );
			expect( descriptionRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( actionsRef.current ).toBeInstanceOf( HTMLDivElement );
			expect( actionButtonRef.current ).toBeInstanceOf(
				HTMLButtonElement
			);
			expect( actionLinkRef.current ).toBeInstanceOf( HTMLAnchorElement );
			expect( closeIconRef.current ).toBeInstanceOf( HTMLButtonElement );
		} );

		it( 'renders content', () => {
			render(
				<Notice.Root>
					<Notice.Title>Update Available</Notice.Title>
					<Notice.Description>
						A new version is ready to install.
					</Notice.Description>
				</Notice.Root>
			);

			expect( screen.getByText( 'Update Available' ) ).toBeVisible();
			expect(
				screen.getByText( 'A new version is ready to install.' )
			).toBeVisible();
		} );
	} );

	describe( 'dismissing via CloseIcon', () => {
		it( 'renders dismiss button when CloseIcon included', async () => {
			const user = userEvent.setup();
			const handleDismiss = jest.fn();

			render(
				<Notice.Root>
					<Notice.Description>Dismissible</Notice.Description>
					<Notice.CloseIcon onClick={ handleDismiss } />
				</Notice.Root>
			);

			await user.click(
				screen.getByRole( 'button', { name: 'Dismiss' } )
			);
			expect( handleDismiss ).toHaveBeenCalledTimes( 1 );
		} );

		it( 'does not render dismiss button when CloseIcon omitted', () => {
			render(
				<Notice.Root>
					<Notice.Description>Non-dismissible</Notice.Description>
				</Notice.Root>
			);

			expect(
				screen.queryByRole( 'button', { name: 'Dismiss' } )
			).not.toBeInTheDocument();
		} );

		it( 'supports custom CloseIcon label', () => {
			render(
				<Notice.Root>
					<Notice.Description>Test</Notice.Description>
					<Notice.CloseIcon
						label="Close notification"
						onClick={ jest.fn() }
					/>
				</Notice.Root>
			);
			expect(
				screen.getByRole( 'button', { name: 'Close notification' } )
			).toBeVisible();
		} );
	} );

	describe( 'decorative icon', () => {
		it( 'renders icon for non-neutral intents', () => {
			const { container } = render(
				<Notice.Root intent="info">
					<Notice.Description>Info message</Notice.Description>
				</Notice.Root>
			);
			// Disable reason: The decorative SVG has aria-hidden and no role,
			// so there is no Testing Library query that can target it.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			const icon = container.querySelector( 'svg' );
			expect( icon ).toBeVisible();
			expect( icon ).toHaveAttribute( 'aria-hidden', 'true' );
		} );

		it( 'does not render icon for neutral intent', () => {
			const { container } = render(
				<Notice.Root intent="neutral">
					<Notice.Description>Neutral message</Notice.Description>
				</Notice.Root>
			);
			// Disable reason: The decorative SVG has aria-hidden and no role,
			// so there is no Testing Library query that can target it.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
		} );

		it( 'hides icon when icon prop is null', () => {
			const { container } = render(
				<Notice.Root intent="info" icon={ null }>
					<Notice.Description>No icon</Notice.Description>
				</Notice.Root>
			);
			// Disable reason: The decorative SVG has aria-hidden and no role,
			// so there is no Testing Library query that can target it.
			// eslint-disable-next-line testing-library/no-container, testing-library/no-node-access
			expect( container.querySelector( 'svg' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'actions', () => {
		it( 'renders ActionButton and ActionLink', async () => {
			const user = userEvent.setup();
			const handleClick = jest.fn();

			render(
				<Notice.Root>
					<Notice.Description>Notice with actions</Notice.Description>
					<Notice.Actions>
						<Notice.ActionButton onClick={ handleClick }>
							Retry
						</Notice.ActionButton>
						<Notice.ActionLink href="/docs">
							Learn more
						</Notice.ActionLink>
					</Notice.Actions>
				</Notice.Root>
			);

			await user.click( screen.getByRole( 'button', { name: 'Retry' } ) );
			expect( handleClick ).toHaveBeenCalledTimes( 1 );

			expect(
				screen.getByRole( 'link', { name: 'Learn more' } )
			).toHaveAttribute( 'href', '/docs' );
		} );
	} );

	describe( 'announcing to screen readers', () => {
		it( 'creates a polite live region for non-error intents', () => {
			render(
				<Notice.Root intent="info">
					<Notice.Description>Update available.</Notice.Description>
				</Notice.Root>
			);
			expect(
				screen.getByText( 'Update available.', {
					selector: '[aria-live="polite"]',
				} )
			).toBeInTheDocument();
		} );

		it( 'creates an assertive live region for error intent', () => {
			render(
				<Notice.Root intent="error">
					<Notice.Description>Something failed.</Notice.Description>
				</Notice.Root>
			);
			expect(
				screen.getByText( 'Something failed.', {
					selector: '[aria-live="assertive"]',
				} )
			).toBeInTheDocument();
		} );
	} );
} );
