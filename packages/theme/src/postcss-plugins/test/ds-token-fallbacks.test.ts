import { addFallbackToVar } from '../ds-token-fallbacks.mjs';

describe( 'addFallbackToVar', () => {
	it( 'injects a fallback for a known token', () => {
		expect(
			addFallbackToVar( 'var(--wpds-typography-font-family-mono)' )
		).toBe(
			'var(--wpds-typography-font-family-mono, "Menlo", "Consolas", monaco, monospace)'
		);
	} );

	it( 'throws for an unknown token', () => {
		expect( () => addFallbackToVar( 'var(--wpds-nonexistent)' ) ).toThrow(
			'Unknown design token: --wpds-nonexistent'
		);
	} );

	it( 'leaves var() calls that already have a fallback', () => {
		expect(
			addFallbackToVar( 'var(--wpds-border-radius-sm, 999px)' )
		).toBe( 'var(--wpds-border-radius-sm, 999px)' );
	} );

	it( 'leaves var() calls that are not design token properties', () => {
		expect( addFallbackToVar( 'var(--my-custom-prop)' ) ).toBe(
			'var(--my-custom-prop)'
		);
	} );

	it( 'escapes quotes in fallback values when escapeQuotes is true', () => {
		expect(
			addFallbackToVar( 'var(--wpds-typography-font-family-mono)', {
				escapeQuotes: true,
			} )
		).toBe(
			'var(--wpds-typography-font-family-mono, \\"Menlo\\", \\"Consolas\\", monaco, monospace)'
		);
	} );
} );
