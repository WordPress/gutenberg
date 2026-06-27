import { computeBrandFallback, formatDesignTokenFallbacksScss } from '../index';

jest.mock( '@terrazzo/plugin-css', () => ( { FORMAT_ID: 'css/value' } ) );

describe( 'computeBrandFallback', () => {
	it( 'throws on colors with alpha (8-digit hex)', () => {
		expect( () => computeBrandFallback( '#3858e980' ) ).toThrow(
			/does not support colors with alpha/
		);
	} );

	it( 'throws on colors with alpha (4-digit hex)', () => {
		expect( () => computeBrandFallback( '#f008' ) ).toThrow(
			/does not support colors with alpha/
		);
	} );
} );

describe( 'formatDesignTokenFallbacksScss', () => {
	it( 'generates a Sass map and var function', () => {
		const scss = formatDesignTokenFallbacksScss( {
			'--wpds-border-radius-sm': '2px',
			'--wpds-border-width-focus':
				'var(--wp-admin-border-width-focus, 2px)',
			'--wpds-typography-font-family-mono':
				'"Menlo", "Consolas", monaco, monospace',
		} );

		expect( scss ).toContain( '@use "sass:map";' );
		expect( scss ).toContain( '@function var($token)' );
		expect( scss ).toContain( "'--wpds-border-radius-sm': '2px'" );
		expect( scss ).toContain(
			"'--wpds-border-width-focus': 'var(--wp-admin-border-width-focus, 2px)'"
		);
		expect( scss ).toContain(
			'\'--wpds-typography-font-family-mono\': \'"Menlo", "Consolas", monaco, monospace\''
		);
	} );

	it( 'escapes backslashes and single quotes', () => {
		const scss = formatDesignTokenFallbacksScss( {
			'--wpds-x-single-quote': "a'b",
			'--wpds-x-backslash': 'a\\b',
			'--wpds-x-both': "a'\\b",
		} );

		expect( scss ).toContain( "'--wpds-x-single-quote': 'a\\'b'" );
		expect( scss ).toContain( "'--wpds-x-backslash': 'a\\\\b'" );
		expect( scss ).toContain( "'--wpds-x-both': 'a\\'\\\\b'" );
	} );

	it( 'throws on Sass interpolation syntax', () => {
		expect( () =>
			formatDesignTokenFallbacksScss( {
				'--wpds-x-interpolation': 'calc(#{some-value} * 1px)',
			} )
		).toThrow(
			/Sass interpolation syntax is not supported in design token fallbacks: --wpds-x-interpolation/
		);
	} );
} );
