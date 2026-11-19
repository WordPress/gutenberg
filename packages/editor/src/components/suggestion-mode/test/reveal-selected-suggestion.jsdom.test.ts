import { describe, expect, it, vi } from 'vitest';
import { buildSelectedSuggestionCss } from '../reveal-selected-suggestion';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

describe( 'buildSelectedSuggestionCss', () => {
	it( 'emits nothing when no note is selected', () => {
		expect( buildSelectedSuggestionCss() ).toBe( '' );
		expect( buildSelectedSuggestionCss( null ) ).toBe( '' );
	} );

	it( 'targets the selected suggestion marker by id', () => {
		const css = buildSelectedSuggestionCss( 42 );
		expect( css ).toContain(
			'mark:is(.wp-suggestion-add, .wp-suggestion-del, .wp-suggestion-format)[data-suggestion-id="42"]{'
		);
	} );

	it( 'thickens the marker rule, like a selected note', () => {
		const css = buildSelectedSuggestionCss( 7 );
		expect( css ).toContain( 'text-decoration-thickness:3px;' );
		expect( css ).not.toContain( 'outline' );
	} );

	it( 'only ever styles the selected marker', () => {
		const css = buildSelectedSuggestionCss( 7 );
		expect( css.match( /\[data-suggestion-id=/g ) ).toHaveLength( 1 );
	} );
} );
