import {
	buildSuggestionAuthorColorCss,
	buildSuggestionAuthorAnnouncementCss,
} from '../suggestion-author-colors';

const inlineThread = ( id, author, authorName ) => ( {
	id,
	author,
	author_name: authorName,
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

describe( 'buildSuggestionAuthorAnnouncementCss', () => {
	it( 'returns empty string when there is nobody to name', () => {
		expect( buildSuggestionAuthorAnnouncementCss() ).toBe( '' );
		expect( buildSuggestionAuthorAnnouncementCss( [] ) ).toBe( '' );
		// No display name to announce.
		expect(
			buildSuggestionAuthorAnnouncementCss( [ inlineThread( 1, 1 ) ] )
		).toBe( '' );
	} );

	it( 'names the suggester in the bracketing announcement for each type', () => {
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 4, 'Edith Editor' ),
		] );
		expect( css ).toContain(
			'.wp-suggestion[data-author="4"][data-suggestion-type="add"] .wp-suggestion-a11y::before{content:"Start of suggested addition by Edith Editor.";}'
		);
		expect( css ).toContain(
			'.wp-suggestion[data-author="4"][data-suggestion-type="del"] .wp-suggestion-a11y::after{content:"End of suggested deletion by Edith Editor.";}'
		);
		expect( css ).toContain(
			'[data-suggestion-type="format"] .wp-suggestion-a11y::before{content:"Start of suggested formatting change by Edith Editor.";}'
		);
	} );

	it( 'decodes entities and escapes quotes in a display name', () => {
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 2, 'Ren&#233;e &quot;Rex&quot; O&#039;Hara' ),
		] );
		expect( css ).toContain( 'Renée \\"Rex\\" O\'Hara' );
	} );

	it( 'names an author whose first thread carried no display name', () => {
		// Threads are scanned in order and the name is memoized per author. A
		// response that omitted author_name must not be the one that sticks:
		// every marker that author owns would fall back to the anonymous
		// announcement even though a later thread names them.
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 5 ),
			inlineThread( 2, 5, 'Robin' ),
		] );
		expect( css ).toContain( 'Start of suggested addition by Robin.' );
		expect( css.match( /data-author="5"/g ) ).toHaveLength( 6 );
	} );

	it( 'emits one block of rules per distinct author', () => {
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 7, 'Sam' ),
			inlineThread( 2, 7, 'Sam' ),
		] );
		expect( css.match( /data-author="7"/g ) ).toHaveLength( 6 );
	} );
} );
