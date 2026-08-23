import { hasPendingSuggestionMarkers } from '../pending-suggestion-markers';

const marker =
	'<mark class="wp-suggestion" data-suggestion-id="7" data-suggestion-type="add">there</mark>';

describe( 'hasPendingSuggestionMarkers', () => {
	it( 'finds a marker in serialized content', () => {
		expect(
			hasPendingSuggestionMarkers(
				`<!-- wp:paragraph --><p>Hello ${ marker }</p><!-- /wp:paragraph -->`
			)
		).toBe( true );
	} );

	it( 'finds a marker whatever order its attributes serialize in', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<mark data-suggestion-type="del" data-suggestion-id="7" class="wp-suggestion">gone</mark>'
			)
		).toBe( true );
	} );

	it( 'finds a marker sharing its element with another class', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<mark class="wp-note wp-suggestion" data-suggestion-id="7">both</mark>'
			)
		).toBe( true );
	} );

	it( 'answers false for empty or marker-free content', () => {
		expect( hasPendingSuggestionMarkers( '' ) ).toBe( false );
		expect( hasPendingSuggestionMarkers( undefined ) ).toBe( false );
		expect( hasPendingSuggestionMarkers( '<p>Nothing here.</p>' ) ).toBe(
			false
		);
	} );

	it( 'ignores a class the marker class is only a prefix of', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<p class="wp-suggestion-box">A callout.</p>'
			)
		).toBe( false );
		expect(
			hasPendingSuggestionMarkers(
				'<mark class="wp-suggestion-box" data-suggestion-id="7">x</mark>'
			)
		).toBe( false );
	} );

	it( 'ignores a code sample showing the markup', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<pre class="wp-block-code"><code>&lt;mark class="wp-suggestion" data-suggestion-id="1"&gt;</code></pre>'
			)
		).toBe( false );
	} );

	it( 'ignores prose naming the class', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<p>Suggestions serialize as <code>wp-suggestion</code>.</p>'
			)
		).toBe( false );
	} );

	it( 'ignores a mark carrying the class but no suggestion id', () => {
		// A highlight left behind by an accepted suggestion, or a
		// hand-written `<mark>` that happens to borrow the class, is not
		// something the author can accept or reject.
		expect(
			hasPendingSuggestionMarkers(
				'<mark class="wp-suggestion">orphan</mark>'
			)
		).toBe( false );
	} );

	it( 'ignores a suggestion id on an element that is not a marker', () => {
		expect(
			hasPendingSuggestionMarkers(
				'<span class="wp-suggestion" data-suggestion-id="7">x</span>'
			)
		).toBe( false );
	} );

	it( 'finds a later marker when an earlier mark is a false positive', () => {
		expect(
			hasPendingSuggestionMarkers(
				`<mark class="wp-suggestion-box">decoy</mark><p>Hello ${ marker }</p>`
			)
		).toBe( true );
	} );
} );
