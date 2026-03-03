import { addFallbackToVar } from '../add-fallback-to-var';

const mockFallbacks: Record< string, string > = {
	'--wpds-border-radius-sm': '2px',
	'--wpds-dimension-gap-sm': '8px',
	'--wpds-dimension-gap-lg': '16px',
	'--wpds-color-bg-interactive-brand-strong':
		'var(--wp-admin-theme-color, #3858e9)',
	'--wpds-color-bg-interactive-brand-strong-active':
		'color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 92%, black)',
};

describe( 'addFallbackToVar', () => {
	it( 'injects a fallback for a known token', () => {
		expect(
			addFallbackToVar( 'var(--wpds-border-radius-sm)', mockFallbacks )
		).toBe( 'var(--wpds-border-radius-sm, 2px)' );
	} );

	it( 'leaves unknown tokens untouched', () => {
		expect(
			addFallbackToVar( 'var(--wpds-nonexistent-token)', mockFallbacks )
		).toBe( 'var(--wpds-nonexistent-token)' );
	} );

	it( 'leaves non-wpds custom properties untouched', () => {
		expect(
			addFallbackToVar( 'var(--my-custom-prop)', mockFallbacks )
		).toBe( 'var(--my-custom-prop)' );
	} );

	it( 'does not double-wrap a var() that already has a fallback', () => {
		expect(
			addFallbackToVar(
				'var(--wpds-border-radius-sm, 999px)',
				mockFallbacks
			)
		).toBe( 'var(--wpds-border-radius-sm, 999px)' );
	} );

	it( 'handles multiple var() calls in one value', () => {
		const input =
			'var(--wpds-dimension-gap-sm) var(--wpds-dimension-gap-lg)';
		const result = addFallbackToVar( input, mockFallbacks );
		expect( result ).toBe(
			'var(--wpds-dimension-gap-sm, 8px) var(--wpds-dimension-gap-lg, 16px)'
		);
	} );

	it( 'injects a brand token fallback with var(--wp-admin-theme-color)', () => {
		const result = addFallbackToVar(
			'var(--wpds-color-bg-interactive-brand-strong)',
			mockFallbacks
		);
		expect( result ).toBe(
			'var(--wpds-color-bg-interactive-brand-strong, var(--wp-admin-theme-color, #3858e9))'
		);
	} );

	it( 'injects a color-mix fallback for a derived brand token', () => {
		const result = addFallbackToVar(
			'var(--wpds-color-bg-interactive-brand-strong-active)',
			mockFallbacks
		);
		expect( result ).toBe(
			'var(--wpds-color-bg-interactive-brand-strong-active, color-mix(in oklch, var(--wp-admin-theme-color, #3858e9) 92%, black))'
		);
	} );

	it( 'returns the original string when there are no var() calls', () => {
		expect( addFallbackToVar( '10px solid red', mockFallbacks ) ).toBe(
			'10px solid red'
		);
	} );

	it( 'injects a fallback inside calc()', () => {
		expect(
			addFallbackToVar(
				'calc(var(--wpds-dimension-gap-sm) * 2)',
				mockFallbacks
			)
		).toBe( 'calc(var(--wpds-dimension-gap-sm, 8px) * 2)' );
	} );

	it( 'is idempotent — running twice gives the same result', () => {
		const input = 'var(--wpds-border-radius-sm)';
		const first = addFallbackToVar( input, mockFallbacks );
		const second = addFallbackToVar( first, mockFallbacks );
		expect( second ).toBe( first );
	} );
} );
