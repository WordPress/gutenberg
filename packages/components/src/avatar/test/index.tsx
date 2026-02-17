/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Avatar from '..';

describe( 'Avatar', () => {
	it( 'should render with default props', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toBeInTheDocument();
		expect( avatar.tagName ).toBe( 'DIV' );
		expect( avatar ).toHaveClass( 'components-avatar' );
	} );

	it( 'should set the accessible name from the name prop', () => {
		render( <Avatar name="Jane Doe" /> );
		const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
		expect( avatar ).toBeInTheDocument();
	} );

	it( 'should apply the avatar image via CSS custom property', () => {
		render(
			<Avatar data-testid="avatar" src="https://example.com/avatar.jpg" />
		);
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveClass( 'has-src' );
		expect(
			avatar.style.getPropertyValue( '--components-avatar-url' )
		).toBe( 'url(https://example.com/avatar.jpg)' );
	} );

	it( 'should apply is-small class for small size', () => {
		render( <Avatar data-testid="avatar" size="small" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveClass( 'is-small' );
	} );

	it( 'should not apply is-small class for default size', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).not.toHaveClass( 'is-small' );
	} );

	it( 'should apply border color when provided', () => {
		render( <Avatar data-testid="avatar" borderColor="#3858e9" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveClass( 'has-avatar-border-color' );
		expect(
			avatar.style.getPropertyValue( '--components-avatar-outline-color' )
		).toBe( '#3858e9' );
	} );

	it( 'should not have has-src class when src is not provided', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).not.toHaveClass( 'has-src' );
	} );

	it( 'should combine custom className with default class', () => {
		render( <Avatar data-testid="avatar" className="custom" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveClass( 'components-avatar' );
		expect( avatar ).toHaveClass( 'custom' );
	} );

	describe( 'badge', () => {
		it( 'should not show badge by default', () => {
			render( <Avatar data-testid="avatar" name="Zoraya" /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'has-badge' );
			expect( screen.queryByText( 'Zoraya' ) ).not.toBeInTheDocument();
		} );

		it( 'should render name span when badge is true', () => {
			render( <Avatar data-testid="avatar" name="Zoraya" badge /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'has-badge' );
			expect( screen.getByText( 'Zoraya' ) ).toBeInTheDocument();
		} );

		it( 'should render name span with borderColor too', () => {
			render(
				<Avatar
					data-testid="avatar"
					name="Zoraya"
					borderColor="#3d5eef"
					badge
				/>
			);
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'has-badge' );
			expect( screen.getByText( 'Zoraya' ) ).toBeInTheDocument();
		} );

		it( 'should not show badge when badge is true but name is missing', () => {
			render( <Avatar data-testid="avatar" badge /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'has-badge' );
		} );

		it( 'should still set aria-label even when badge is visible', () => {
			render( <Avatar name="Zoraya" badge /> );
			const avatar = screen.getByRole( 'img', { name: 'Zoraya' } );
			expect( avatar ).toBeInTheDocument();
		} );
	} );

	describe( 'label', () => {
		it( 'should show label text instead of name in the badge', () => {
			render( <Avatar name="Jane Doe" label="You" badge /> );
			expect( screen.getByText( 'You' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Jane Doe' ) ).not.toBeInTheDocument();
		} );

		it( 'should keep aria-label as name when label is provided', () => {
			render( <Avatar name="Jane Doe" label="You" badge /> );
			const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
			expect( avatar ).toBeInTheDocument();
		} );

		it( 'should wrap in tooltip when label differs from name', () => {
			render( <Avatar name="Jane Doe" label="You" badge /> );
			const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
			// The Tooltip's Ariakit.TooltipAnchor makes the element
			// focusable so the tooltip can be triggered via keyboard.
			expect( avatar ).toHaveAttribute( 'tabindex', '0' );
		} );
	} );

	describe( 'dimmed', () => {
		it( 'should apply is-dimmed class when dimmed', () => {
			render( <Avatar data-testid="avatar" dimmed /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'is-dimmed' );
		} );

		it( 'should not apply is-dimmed class by default', () => {
			render( <Avatar data-testid="avatar" /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'is-dimmed' );
		} );

		it( 'should render statusIndicator when dimmed', () => {
			render(
				<Avatar
					data-testid="avatar"
					dimmed
					statusIndicator={ <span>icon</span> }
				/>
			);
			expect( screen.getByText( 'icon' ) ).toBeInTheDocument();
		} );

		it( 'should not render statusIndicator when not dimmed', () => {
			render(
				<Avatar
					data-testid="avatar"
					statusIndicator={ <span>icon</span> }
				/>
			);
			expect( screen.queryByText( 'icon' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'initials', () => {
		it( 'should show initials when no src is provided', () => {
			render( <Avatar name="Tanner Robinson" /> );
			expect( screen.getByText( 'TR' ) ).toBeInTheDocument();
		} );

		it( 'should show single initial for single-word name', () => {
			render( <Avatar name="Zoraya" /> );
			expect( screen.getByText( 'Z' ) ).toBeInTheDocument();
		} );

		it( 'should not show initials when src is provided', () => {
			render(
				<Avatar
					name="Tanner Robinson"
					src="https://example.com/avatar.jpg"
				/>
			);
			expect( screen.queryByText( 'TR' ) ).not.toBeInTheDocument();
		} );
	} );
} );
