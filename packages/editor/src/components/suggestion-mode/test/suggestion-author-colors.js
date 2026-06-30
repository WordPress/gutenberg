/**
 * Internal dependencies
 */
import { buildSuggestionAuthorColorCss } from '../suggestion-author-colors';

const inlineThread = ( id, author ) => ( {
	id,
	author,
	meta: {
		_wp_suggestion: JSON.stringify( {
			schemaVersion: 2,
			operations: [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'del',
				},
			],
		} ),
	},
} );

describe( 'buildSuggestionAuthorColorCss', () => {
	it( 'returns empty string for no threads', () => {
		expect( buildSuggestionAuthorColorCss() ).toBe( '' );
		expect( buildSuggestionAuthorColorCss( [] ) ).toBe( '' );
	} );

	it( 'emits a --suggestion-author-color rule per author', () => {
		const css = buildSuggestionAuthorColorCss( [
			inlineThread( 1, 1 ),
			inlineThread( 2, 3 ),
		] );
		// Author 1 → index 1 (#D94145), author 3 → index 3 (#FF35EE).
		expect( css ).toContain(
			'.wp-suggestion[data-author="1"]{--suggestion-author-color:#D94145;}'
		);
		expect( css ).toContain(
			'.wp-suggestion[data-author="3"]{--suggestion-author-color:#FF35EE;}'
		);
	} );

	it( 'emits one rule per distinct author', () => {
		const css = buildSuggestionAuthorColorCss( [
			inlineThread( 1, 1 ),
			inlineThread( 2, 1 ),
			inlineThread( 3, 1 ),
		] );
		expect( css.match( /\.wp-suggestion\[data-author/g ) ).toHaveLength(
			1
		);
	} );

	it( 'ignores threads without an inline-suggestion op', () => {
		const structural = {
			id: 9,
			author: 2,
			meta: {
				_wp_suggestion: JSON.stringify( {
					schemaVersion: 2,
					operations: [ { type: 'block-remove' } ],
				} ),
			},
		};
		expect( buildSuggestionAuthorColorCss( [ structural ] ) ).toBe( '' );
	} );

	it( 'tolerates a missing or malformed payload', () => {
		expect(
			buildSuggestionAuthorColorCss( [ { id: 1, author: 1 } ] )
		).toBe( '' );
		expect(
			buildSuggestionAuthorColorCss( [
				{ id: 1, author: 1, meta: { _wp_suggestion: 'not json' } },
			] )
		).toBe( '' );
	} );
} );
