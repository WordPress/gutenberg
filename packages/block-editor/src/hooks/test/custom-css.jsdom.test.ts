import { describe, expect, it } from 'vitest';
import { processCustomCSSStateEntries } from '../custom-css';

describe( 'processCustomCSSStateEntries', () => {
	it( 'renders valid entries when another state contains HTML markup', () => {
		const generatedCSS = processCustomCSSStateEntries(
			[
				{
					css: 'color: red;',
				},
				{
					css: '<script>alert(1)</script>',
					pseudoState: ':hover',
				},
			],
			'.block'
		);

		expect( generatedCSS ).toContain( 'color: red' );
		expect( generatedCSS ).not.toContain( '<script>' );
	} );

	it( 'returns no CSS when every state contains HTML markup', () => {
		expect(
			processCustomCSSStateEntries(
				[ { css: '<script>alert(1)</script>' } ],
				'.block'
			)
		).toBeUndefined();
	} );

	it( 'returns no CSS when valid input produces no rules', () => {
		expect(
			processCustomCSSStateEntries( [ { css: '&' } ], '.block' )
		).toBeUndefined();
	} );
} );
