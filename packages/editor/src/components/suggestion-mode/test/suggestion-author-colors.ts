import { create, toHTMLString } from '@wordpress/rich-text';
import {
	buildSuggestionAuthorColorCss,
	buildSuggestionAuthorAnnouncementCss,
} from '../suggestion-author-colors';
import {
	registerSuggestionFormat,
	addSuggestionRoleFormats,
} from '../../inline-suggestions/format';

const inlineThread = ( id: number, author: number, authorName?: string ) => ( {
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
			'.wp-suggestion-a11y[data-author="4"][data-suggestion-type="add"]::before{content:"Start of suggested addition by Edith Editor.";}'
		);
		expect( css ).toContain(
			'.wp-suggestion-a11y[data-author="4"][data-suggestion-type="del"]::after{content:"End of suggested deletion by Edith Editor.";}'
		);
		expect( css ).toContain(
			'[data-suggestion-type="format"]::before{content:"Start of suggested formatting change by Edith Editor.";}'
		);
	} );

	it( 'decodes entities and escapes quotes in a display name', () => {
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 2, 'Ren&#233;e &quot;Rex&quot; O&#039;Hara' ),
		] );
		expect( css ).toContain( 'Renée \\"Rex\\" O\'Hara' );
	} );

	it( 'collapses every character CSS treats as a newline', () => {
		// A form feed terminates a CSS string exactly as a line feed does. The
		// browser then discards the rest of the declaration and everything
		// after it, so one name would silence the announcements of every
		// author emitted later in the stylesheet.
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 2, 'Lee\fFord' ),
		] );
		expect( css ).toContain( 'Lee Ford' );
		expect( css ).not.toMatch( /[\n\r\f]/ );
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

describe( 'announcements against the rendered editable DOM', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterEach( () => {
		document.body.innerHTML = '';
	} );

	/**
	 * Lay out a marker run the way the editable tree does, so the announcement
	 * selectors are matched against real DOM rather than an assumed shape.
	 *
	 * @param html Serialized marker HTML.
	 * @return The decoration spans, in document order.
	 */
	function decorationSpansIn( html: string ) {
		const value = create( { html } );
		document.body.innerHTML = toHTMLString( {
			value: {
				...value,
				formats: addSuggestionRoleFormats( value.formats ),
			},
		} );
		return document.querySelectorAll( '.wp-suggestion-a11y' );
	}

	/**
	 * Every announcement the injected stylesheet would paint on `span`, as
	 * "pseudo: text". More than one pair means the marker is ambiguous: the
	 * cascade, not the authorship, decides what gets read aloud.
	 *
	 * @param css  Injected stylesheet.
	 * @param span A decoration span.
	 * @return Matching announcements.
	 */
	function announcementsFor( css: string, span: Element ) {
		const found = [];
		for ( const [ , selector, content ] of css.matchAll(
			/([^{}]+)\{content:"((?:[^"\\]|\\.)*)"/g
		) ) {
			const [ base, pseudo ] = selector.split( '::' );
			if ( span.matches( base ) ) {
				found.push( `${ pseudo }: ${ content }` );
			}
		}
		return found;
	}

	it( 'attributes a marker to its own author, not an enclosing one', () => {
		// Overlapping runs from two people serialize as nested markers. The
		// inner run is a descendant of the outer marker too, so an ancestor
		// selector lets whichever author the stylesheet emits last win.
		const spans = decorationSpansIn(
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="add" data-author="4">out' +
				'<mark class="wp-suggestion" data-suggestion-id="2" data-suggestion-type="del" data-author="7">in</mark>' +
				'</mark>'
		);
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 4, 'Ana' ),
			inlineThread( 2, 7, 'Bo' ),
		] );
		expect( spans ).toHaveLength( 2 );
		expect( announcementsFor( css, spans[ 0 ] ) ).toEqual( [
			'before: Start of suggested addition by Ana.',
			'after: End of suggested addition by Ana.',
		] );
		expect( announcementsFor( css, spans[ 1 ] ) ).toEqual( [
			'before: Start of suggested deletion by Bo.',
			'after: End of suggested deletion by Bo.',
		] );
	} );

	it( 'still names the author of a marker holding other formatting', () => {
		// A bold word inside a marker renders between the marker and the
		// decoration span, so the span is not a direct child of the marker.
		const spans = decorationSpansIn(
			'<mark class="wp-suggestion" data-suggestion-id="1" data-suggestion-type="del" data-author="4"><strong>bold</strong></mark>'
		);
		const css = buildSuggestionAuthorAnnouncementCss( [
			inlineThread( 1, 4, 'Ana' ),
		] );
		expect( announcementsFor( css, spans[ 0 ] ) ).toEqual( [
			'before: Start of suggested deletion by Ana.',
			'after: End of suggested deletion by Ana.',
		] );
	} );
} );
