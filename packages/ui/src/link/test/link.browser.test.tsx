import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Link } from '../index';

describe.each( [ 'default', 'unstyled' ] as const )( '%s Link', ( variant ) => {
	it.each( [ 'ltr', 'rtl' ] as const )(
		'keeps the new-tab icon with the final word when the link wraps in %s',
		async ( dir ) => {
			const label =
				dir === 'ltr'
					? 'Discover the terms and phrases'
					: 'גלו את המונחים והביטויים';
			await render(
				<p dir={ dir } style={ { width: 500, font: '16px/1.5 Arial' } }>
					<Link href="#" openInNewTab variant={ variant }>
						{ label }
					</Link>
				</p>
			);

			const icon = screen.getByRole( 'img', {
				name: '(opens in a new tab)',
			} );
			// eslint-disable-next-line testing-library/no-node-access -- A Range needs the text node to measure the final word.
			const text = screen.getByText( label ).firstChild!;
			const range = document.createRange();
			range.selectNodeContents( text );

			// Fit the text, but leave too little space for the trailing icon.
			screen.getByRole( 'paragraph' ).style.width =
				`${ range.getBoundingClientRect().width + icon.getBoundingClientRect().width / 2 }px`;
			range.setStart( text, label.lastIndexOf( ' ' ) + 1 );

			expect(
				Math.abs(
					icon.getBoundingClientRect().bottom -
						range.getBoundingClientRect().bottom
				)
			).toBeLessThan( 2 );
		}
	);
} );

it.each( [ 'brand', 'neutral' ] as const )(
	'underlines only the text of styled links with the %s tone',
	async ( tone ) => {
		await render(
			<>
				<Link href="#" openInNewTab tone={ tone }>
					Styled link
				</Link>
				<Link href="#" openInNewTab variant="unstyled" tone={ tone }>
					Unstyled link
				</Link>
			</>
		);

		const styled = screen.getAllByRole( 'link' )[ 0 ];
		const icon = within( styled ).getByRole( 'img', {
			name: '(opens in a new tab)',
		} );
		// An inline icon also receives any underline painted by the anchor.
		expect(
			getComputedStyle( icon ).display === 'inline-block' ||
				getComputedStyle( styled ).textDecorationLine === 'none'
		).toBe( true );
		expect(
			getComputedStyle( screen.getByText( 'Styled link' ) )
				.textDecorationLine
		).toBe( 'underline' );
		expect(
			getComputedStyle( screen.getByText( 'Styled link' ) )
				.textDecorationColor
		).toBe( getComputedStyle( styled ).textDecorationColor );
		expect( getComputedStyle( icon ).textDecorationLine ).toBe( 'none' );
		expect(
			getComputedStyle( screen.getByText( 'Unstyled link' ) )
				.textDecorationLine
		).toBe( 'none' );
	}
);
