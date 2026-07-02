import { createRef } from '@wordpress/element';
import { screen, render } from '@testing-library/react';
import { LinkButton } from '../index';

describe( 'LinkButton', () => {
	it( 'renders a link element by default', () => {
		render( <LinkButton href="/example">Go to example</LinkButton> );

		const link = screen.getByRole( 'link', { name: 'Go to example' } );

		expect( link ).toBeVisible();
		expect( link ).toHaveAttribute( 'href', '/example' );
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<LinkButton ref={ ref } href="/example">
				Go to example
			</LinkButton>
		);

		expect( ref.current ).toBeInstanceOf( HTMLAnchorElement );
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-link-button';
		render(
			<LinkButton href="/example" className={ customClass }>
				Go to example
			</LinkButton>
		);
		expect(
			screen.getByRole( 'link', { name: 'Go to example' } )
		).toHaveClass( customClass );
	} );

	describe( 'openInNewTab', () => {
		it( 'sets target="_blank" when true', () => {
			render(
				<LinkButton href="https://example.com" openInNewTab>
					External
				</LinkButton>
			);

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );
	} );
} );
