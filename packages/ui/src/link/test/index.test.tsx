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
			).toBeInTheDocument();
		} );

		it( 'prevents default for internal anchor links', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn();

			render(
				<Link href="#section" openInNewTab onClick={ onClick }>
					Jump
				</Link>
			);

			await user.click( screen.getByRole( 'link' ) );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
			expect( onClick.mock.calls[ 0 ][ 0 ].defaultPrevented ).toBe(
				true
			);
		} );

		it( 'does not prevent default for external links', async () => {
			const user = userEvent.setup();
			const onClick = jest.fn();

			render(
				<Link
					href="https://example.com"
					openInNewTab
					onClick={ onClick }
				>
					External
				</Link>
			);

			await user.click( screen.getByRole( 'link' ) );

			expect( onClick ).toHaveBeenCalledTimes( 1 );
			expect( onClick.mock.calls[ 0 ][ 0 ].defaultPrevented ).toBe(
				false
			);
		} );
	} );
} );
