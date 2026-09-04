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
		expect( buildSelectedSuggestionCss( undefined, 1 ) ).toBe( '' );
		expect( buildSelectedSuggestionCss( null, 1 ) ).toBe( '' );
	} );

	it( 'targets the selected suggestion marker by id', () => {
		const css = buildSelectedSuggestionCss( 42, 1 );
		expect( css ).toContain(
			'mark.wp-suggestion[data-suggestion-id="42"]{'
		);
	} );

	it( 'tints and rings the marker in the suggester colour', () => {
		// Author 1 → index 1 (#D94145).
		const css = buildSelectedSuggestionCss( 7, 1 );
		expect( css ).toContain( 'background-color:#D9414533;' );
		expect( css ).toContain( 'outline:2px solid #D94145;' );
	} );

	it( 'only ever styles the selected marker', () => {
		const css = buildSelectedSuggestionCss( 7, 1 );
		expect( css.match( /mark\.wp-suggestion/g ) ).toHaveLength( 1 );
	} );
} );
