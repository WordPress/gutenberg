/**
 * External dependencies
 */
import { render, screen, fireEvent } from '@testing-library/react';

/**
 * Internal dependencies
 */
import Avatar from '..';

/**
 * In JSDOM, `<img>` elements never fire `load` or `error` events on their
 * own. We simulate them using `fireEvent` on the `<img>` element, which we
 * locate via `getByAltText('')` (the `<img>` has `alt=""`).
 */

describe( 'Avatar', () => {
	it( 'should render with default props', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toBeInTheDocument();
		expect( avatar.tagName ).toBe( 'DIV' );
		expect( avatar ).toHaveClass( 'editor-avatar' );
	} );

	it( 'should set the accessible name from the name prop', () => {
		render( <Avatar name="Jane Doe" /> );
		const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
		expect( avatar ).toBeInTheDocument();
	} );

	it( 'should not set role or aria-label without a name', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).not.toHaveAttribute( 'role' );
		expect( avatar ).not.toHaveAttribute( 'aria-label' );
	} );

	it( 'should render an img element when src is provided', () => {
		render(
			<Avatar
				data-testid="avatar"
				name="Jane Doe"
				src="https://example.com/avatar.jpg"
			/>
		);
		// The <img> should be in the DOM (hidden until loaded).
		const img = screen.getByAltText( '' );
		expect( img.tagName ).toBe( 'IMG' );
		expect( img ).toHaveAttribute(
			'src',
			'https://example.com/avatar.jpg'
		);
	} );

	it( 'should apply has-src class only after image loads', () => {
		render(
			<Avatar
				data-testid="avatar"
				name="Jane Doe"
				src="https://example.com/avatar.jpg"
			/>
		);
		const avatar = screen.getByTestId( 'avatar' );
		// Before load fires, has-src should not be set.
		expect( avatar ).not.toHaveClass( 'has-src' );

		// Simulate image load.
		fireEvent.load( screen.getByAltText( '' ) );
		expect( avatar ).toHaveClass( 'has-src' );
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
			avatar.style.getPropertyValue( '--editor-avatar-outline-color' )
		).toBe( '#3858e9' );
	} );

	it( 'should set name color custom property when borderColor is provided', () => {
		render( <Avatar data-testid="avatar" borderColor="#3858e9" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect(
			avatar.style.getPropertyValue( '--editor-avatar-name-color' )
		).toBeTruthy();
	} );

	it( 'should not have has-src class when src is not provided', () => {
		render( <Avatar data-testid="avatar" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).not.toHaveClass( 'has-src' );
	} );

	it( 'should combine custom className with default class', () => {
		render( <Avatar data-testid="avatar" className="custom" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveClass( 'editor-avatar' );
		expect( avatar ).toHaveClass( 'custom' );
	} );

	it( 'should pass through additional HTML attributes', () => {
		render( <Avatar data-testid="avatar" data-custom="value" /> );
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveAttribute( 'data-custom', 'value' );
	} );

	it( 'should merge style prop with custom properties', () => {
		render(
			<Avatar
				data-testid="avatar"
				borderColor="#3858e9"
				style={ { left: '10px' } }
			/>
		);
		const avatar = screen.getByTestId( 'avatar' );
		expect( avatar ).toHaveStyle( { left: '10px' } );
		expect(
			avatar.style.getPropertyValue( '--editor-avatar-outline-color' )
		).toBe( '#3858e9' );
	} );

	describe( 'variant: badge', () => {
		it( 'should not show badge by default', () => {
			render( <Avatar data-testid="avatar" name="Zoraya" /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'is-badge' );
			expect( screen.queryByText( 'Zoraya' ) ).not.toBeInTheDocument();
		} );

		it( 'should render name span with badge variant', () => {
			render(
				<Avatar data-testid="avatar" name="Zoraya" variant="badge" />
			);
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'is-badge' );
			expect( screen.getByText( 'Zoraya' ) ).toBeInTheDocument();
		} );

		it( 'should render name span with borderColor too', () => {
			render(
				<Avatar
					data-testid="avatar"
					name="Zoraya"
					borderColor="#3d5eef"
					variant="badge"
				/>
			);
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'is-badge' );
			expect( screen.getByText( 'Zoraya' ) ).toBeInTheDocument();
		} );

		it( 'should not show badge when name is missing', () => {
			render( <Avatar data-testid="avatar" variant="badge" /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'is-badge' );
		} );

		it( 'should still set aria-label even when badge is visible', () => {
			render( <Avatar name="Zoraya" variant="badge" /> );
			const avatar = screen.getByRole( 'img', { name: 'Zoraya' } );
			expect( avatar ).toBeInTheDocument();
		} );
	} );

	describe( 'label', () => {
		it( 'should show label text instead of name in the badge', () => {
			render( <Avatar name="Jane Doe" label="You" variant="badge" /> );
			expect( screen.getByText( 'You' ) ).toBeInTheDocument();
			expect( screen.queryByText( 'Jane Doe' ) ).not.toBeInTheDocument();
		} );

		it( 'should keep aria-label as name when label is provided', () => {
			render( <Avatar name="Jane Doe" label="You" variant="badge" /> );
			const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
			expect( avatar ).toBeInTheDocument();
		} );

		it( 'should wrap in tooltip when label differs from name', () => {
			render( <Avatar name="Jane Doe" label="You" variant="badge" /> );
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

		it( 'should apply has-src class when dimmed after image loads', () => {
			render(
				<Avatar
					data-testid="avatar"
					src="https://example.com/avatar.jpg"
					dimmed
				/>
			);
			fireEvent.load( screen.getByAltText( '' ) );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'has-src' );
			expect( avatar ).toHaveClass( 'is-dimmed' );
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

		it( 'should limit initials to two characters', () => {
			render( <Avatar name="Jane Marie Doe" /> );
			expect( screen.getByText( 'JM' ) ).toBeInTheDocument();
		} );

		it( 'should uppercase initials', () => {
			render( <Avatar name="jane doe" /> );
			expect( screen.getByText( 'JD' ) ).toBeInTheDocument();
		} );

		it( 'should not show initials after image loads', () => {
			render(
				<Avatar
					name="Tanner Robinson"
					src="https://example.com/avatar.jpg"
				/>
			);
			fireEvent.load( screen.getByAltText( '' ) );
			expect( screen.queryByText( 'TR' ) ).not.toBeInTheDocument();
		} );

		it( 'should not render initials when name is not provided', () => {
			render( <Avatar data-testid="avatar" /> );
			const avatar = screen.getByTestId( 'avatar' );
			// Without a name, the image span should be empty (no initials).
			expect( avatar ).not.toHaveTextContent( /.+/ );
		} );
	} );

	describe( 'image loading', () => {
		it( 'should reset to loading state when src changes', () => {
			const { rerender } = render(
				<Avatar
					data-testid="avatar"
					name="Jane Doe"
					src="https://example.com/a.jpg"
				/>
			);
			fireEvent.load( screen.getByAltText( '' ) );
			expect( screen.getByTestId( 'avatar' ) ).toHaveClass( 'has-src' );

			rerender(
				<Avatar
					data-testid="avatar"
					name="Jane Doe"
					src="https://example.com/b.jpg"
				/>
			);
			// New src should reset to loading — initials visible again.
			expect( screen.getByTestId( 'avatar' ) ).not.toHaveClass(
				'has-src'
			);
			expect( screen.getByText( 'JD' ) ).toBeInTheDocument();
		} );

		it( 'should show initials while image is loading', () => {
			render(
				<Avatar
					data-testid="avatar"
					name="Jane Doe"
					src="https://example.com/avatar.jpg"
				/>
			);
			const avatar = screen.getByTestId( 'avatar' );
			// Before load event, initials should show.
			expect( avatar ).not.toHaveClass( 'has-src' );
			expect( screen.getByText( 'JD' ) ).toBeInTheDocument();
		} );

		it( 'should show image after successful load', () => {
			render(
				<Avatar
					data-testid="avatar"
					name="Jane Doe"
					src="https://example.com/avatar.jpg"
				/>
			);

			fireEvent.load( screen.getByAltText( '' ) );

			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).toHaveClass( 'has-src' );
			expect( screen.queryByText( 'JD' ) ).not.toBeInTheDocument();
		} );

		it( 'should fall back to initials when image fails to load', () => {
			render(
				<Avatar
					data-testid="avatar"
					name="Jane Doe"
					src="https://example.com/bad.jpg"
				/>
			);

			fireEvent.error( screen.getByAltText( '' ) );

			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveClass( 'has-src' );
			expect( screen.getByText( 'JD' ) ).toBeInTheDocument();
		} );

		it( 'should not render img element when no src is provided', () => {
			render( <Avatar data-testid="avatar" name="Jane Doe" /> );
			expect( screen.queryByAltText( '' ) ).not.toBeInTheDocument();
		} );
	} );

	describe( 'tooltip', () => {
		it( 'should wrap in tooltip when name is provided without badge', () => {
			render( <Avatar name="Jane Doe" /> );
			const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
			expect( avatar ).toHaveAttribute( 'tabindex', '0' );
		} );

		it( 'should not wrap in tooltip for badge without label', () => {
			render( <Avatar name="Jane Doe" variant="badge" /> );
			const avatar = screen.getByRole( 'img', { name: 'Jane Doe' } );
			// Badge shows the name visibly, so no tooltip needed.
			expect( avatar ).not.toHaveAttribute( 'tabindex' );
		} );

		it( 'should not wrap in tooltip when name is not provided', () => {
			render( <Avatar data-testid="avatar" /> );
			const avatar = screen.getByTestId( 'avatar' );
			expect( avatar ).not.toHaveAttribute( 'tabindex' );
		} );
	} );
} );
