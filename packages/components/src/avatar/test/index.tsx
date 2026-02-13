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
		expect( avatar ).toHaveClass( 'has-border-color' );
		expect(
			avatar.style.getPropertyValue( '--components-avatar-border-color' )
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
} );
