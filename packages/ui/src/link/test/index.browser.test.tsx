import { describe, expect, it } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from 'vitest-browser-react';
import '@wordpress/theme/design-tokens.css';
import { Link } from '../index';

const examples = [
	{ label: 'Discover the terms and phrases', direction: 'ltr' },
	{ label: 'מילים וביטויים שהמבקרים מחפשים', direction: 'rtl' },
	{ label: '訪問者が検索する用語とフレーズ', direction: 'ltr' },
] as const;

describe.each( [ 'default', 'unstyled' ] as const )( '%s Link', ( variant ) => {
	it.each( examples )(
		'keeps the new-tab indicator with the preceding text when the link wraps ($direction, $label)',
		async ( { label, direction } ) => {
			await render(
				<p
					data-testid="paragraph"
					dir={ direction }
					style={ { width: 800, font: '16px/1.5 Arial' } }
				>
					<Link href="#" openInNewTab variant={ variant }>
						<span data-testid="label">{ label }</span>
					</Link>{ ' ' }
					your visitors use to find your site.
				</p>
			);

			const text = screen.getByTestId( 'label' );
			const range = document.createRange();
			range.selectNodeContents( text );
			const paragraph = screen.getByTestId( 'paragraph' );
			paragraph.style.width = `${ Math.ceil(
				range.getBoundingClientRect().width
			) }px`;

			const textNode = document
				.createTreeWalker( text, NodeFilter.SHOW_TEXT )
				.nextNode()!;
			range.setStart( textNode, label.length - 1 );
			const lastCharacter = range.getBoundingClientRect();
			const indicator = screen
				.getByRole( 'img', { name: '(opens in a new tab)' } )
				.getBoundingClientRect();

			expect( indicator.top ).toBeLessThan( lastCharacter.bottom );
			expect( indicator.bottom ).toBeGreaterThan( lastCharacter.top );
			expect( paragraph.getBoundingClientRect().height ).toBeGreaterThan(
				24
			);
		}
	);
} );

it( 'underlines the styled link text without underlining the new-tab indicator', async () => {
	await render(
		<Link href="#" openInNewTab>
			Discover the terms and phrases
		</Link>
	);

	const link = screen.getByRole( 'link' );
	const text = screen.getByText( 'Discover the terms and phrases' );
	const indicator = screen.getByRole( 'img', {
		name: '(opens in a new tab)',
	} );

	expect( getComputedStyle( link ).textDecorationLine ).toBe( 'none' );
	expect( getComputedStyle( text ).textDecorationLine ).toBe( 'underline' );
	expect( getComputedStyle( indicator ).textDecorationLine ).toBe( 'none' );
} );
