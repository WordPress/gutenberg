import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createRef } from '@wordpress/element';
import { Link } from '../index';

describe( 'Link', () => {
	it( 'forwards ref', () => {
		const ref = createRef< HTMLAnchorElement >();

		render(
			<Link ref={ ref } href="/">
				Home
			</Link>
		);

		expect( ref.current ).toBeInstanceOf( HTMLAnchorElement );
	} );

	it( 'calls onClick when clicked (often used for analytics tracking)', async () => {
		const user = userEvent.setup();
		const onClick = jest.fn(
			( event: React.MouseEvent< HTMLAnchorElement > ) =>
				event.preventDefault()
		);

		render(
			<Link href="/page" onClick={ onClick }>
				Go to page
			</Link>
		);

		await user.click( screen.getByRole( 'link', { name: 'Go to page' } ) );

		expect( onClick ).toHaveBeenCalledTimes( 1 );
	} );

	describe( 'openInNewTab', () => {
		it( 'sets target="_blank" when true', () => {
			render(
				<Link href="https://example.com" openInNewTab>
					External
				</Link>
			);

			expect( screen.getByRole( 'link' ) ).toHaveAttribute(
				'target',
				'_blank'
			);
		} );

		it( 'does not set target="_blank" when false', () => {
			render( <Link href="https://example.com">External</Link> );

			expect( screen.getByRole( 'link' ) ).not.toHaveAttribute(
				'target'
			);
		} );

		it( 'renders an accessible arrow indicator', () => {
			render(
				<Link href="https://example.com" openInNewTab>
					External
				</Link>
			);

			expect(
				screen.getByLabelText( '(opens in a new tab)' )
			).toBeVisible();
		} );

		it( 'keeps the link text on the anchor element', () => {
			render(
				<Link href="https://example.com" openInNewTab>
					External
				</Link>
			);

			expect( screen.getByText( 'External' ) ).toBe(
				screen.getByRole( 'link' )
			);
		} );

		it( 'includes the new tab notice in the link name', () => {
			render(
				<Link href="https://example.com" openInNewTab>
					External
				</Link>
			);

			expect(
				screen.getByRole( 'link', {
					name: 'External (opens in a new tab)',
				} )
			).toBeVisible();
		} );

		it( 'treats target="_blank" as opening in a new tab', () => {
			render(
				<Link href="https://example.com" target="_blank">
					External
				</Link>
			);

			expect(
				screen.getByRole( 'link', {
					name: 'External (opens in a new tab)',
				} )
			).toHaveAttribute( 'target', '_blank' );
		} );

		it( 'forwards a named target without adding a new tab notice', () => {
			render(
				<Link href="https://example.com" target="wp-preview-123">
					Preview
				</Link>
			);

			expect(
				screen.getByRole( 'link', { name: 'Preview' } )
			).toHaveAttribute( 'target', 'wp-preview-123' );
			expect(
				screen.queryByLabelText( '(opens in a new tab)' )
			).not.toBeInTheDocument();
		} );

		it( 'preserves an explicit target when openInNewTab is true', () => {
			render(
				<Link
					href="https://example.com"
					target="wp-preview-123"
					openInNewTab
				>
					Preview
				</Link>
			);

			expect(
				screen.getByRole( 'link', {
					name: 'Preview (opens in a new tab)',
				} )
			).toHaveAttribute( 'target', 'wp-preview-123' );
		} );
	} );
} );
