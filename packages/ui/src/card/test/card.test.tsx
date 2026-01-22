/**
 * External dependencies
 */
import { render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Card } from '../index';

describe( 'Card', () => {
	it( 'renders a div by default', () => {
		render( <Card>Content</Card> );

		expect( screen.getByText( 'Content' ).tagName ).toBe( 'DIV' );
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLDivElement >();

		render( <Card ref={ ref }>Content</Card> );

		expect( ref.current ).toBeInstanceOf( HTMLDivElement );
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-card';
		render( <Card className={ customClass }>Content</Card> );

		expect( screen.getByText( 'Content' ) ).toHaveClass( customClass );
	} );

	it( 'renders header and body sections', () => {
		render(
			<Card>
				<Card.Header>Card title</Card.Header>
				<Card.Body>Card content</Card.Body>
			</Card>
		);

		expect( screen.getByText( 'Card title' ).tagName ).toBe( 'DIV' );
		expect( screen.getByText( 'Card content' ).tagName ).toBe( 'DIV' );
	} );
} );
