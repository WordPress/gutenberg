import { describe, expect, it } from 'vitest';
import { createRef } from '@wordpress/element';
import { screen, render } from '@testing-library/react';
import { ButtonLink } from '../index';

describe( 'ButtonLink', () => {
	it( 'renders a link element by default', () => {
		render( <ButtonLink href="/example">Go to example</ButtonLink> );

		const link = screen.getByRole( 'link', { name: 'Go to example' } );

		expect( link ).toBeVisible();
		expect( link ).toHaveAttribute( 'href', '/example' );
	} );

	it( 'forwards ref', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<ButtonLink ref={ ref } href="/example">
				Go to example
			</ButtonLink>
		);

		expect( ref.current ).toBeInstanceOf( HTMLAnchorElement );
	} );

	it( 'merges custom className with built-in classes', () => {
		const customClass = 'my-button-link';
		render(
			<ButtonLink href="/example" className={ customClass }>
				Go to example
			</ButtonLink>
		);
		expect(
			screen.getByRole( 'link', { name: 'Go to example' } )
		).toHaveClass( customClass );
	} );

	describe( 'openInNewTab', () => {
		it( 'sets target="_blank" when true', () => {
			render(
				<ButtonLink href="https://example.com" openInNewTab>
					External
				</ButtonLink>
			);

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );
	} );
} );
