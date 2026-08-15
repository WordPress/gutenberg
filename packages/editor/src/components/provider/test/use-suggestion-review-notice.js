/**
 * The detector behind the "this post has suggested edits" notice. It runs as a
 * substring test on saved post content rather than a block-tree walk, so these
 * cases pin the exact serialized shapes it has to recognise — and the ones it
 * must not claim.
 */
import { hasSuggestionMarkers } from '../use-suggestion-review-notice';

describe( 'hasSuggestionMarkers', () => {
	it( 'ignores empty and non-string content', () => {
		expect( hasSuggestionMarkers( undefined ) ).toBe( false );
		expect( hasSuggestionMarkers( null ) ).toBe( false );
		expect( hasSuggestionMarkers( '' ) ).toBe( false );
		expect( hasSuggestionMarkers( {} ) ).toBe( false );
	} );

	it( 'ignores content with no suggestion state', () => {
		expect(
			hasSuggestionMarkers(
				'<!-- wp:paragraph -->\n<p>The quick <strong>brown</strong> fox</p>\n<!-- /wp:paragraph -->'
			)
		).toBe( false );
	} );

	it( 'does not mistake a note marker for a suggestion', () => {
		expect(
			hasSuggestionMarkers(
				'<!-- wp:paragraph -->\n<p>A <mark class="wp-note" data-note-id="7">noted</mark> phrase</p>\n<!-- /wp:paragraph -->'
			)
		).toBe( false );
	} );

	it.each( [ 'del', 'add', 'format' ] )(
		'detects an inline %s marker',
		( type ) => {
			expect(
				hasSuggestionMarkers(
					`<!-- wp:paragraph -->\n<p>Hello <mark class="wp-suggestion" data-suggestion-id="12" data-suggestion-type="${ type }">world</mark></p>\n<!-- /wp:paragraph -->`
				)
			).toBe( true );
		}
	);

	it.each( [ 'pending-remove', 'pending-insert', 'pending-move' ] )(
		'detects a structural %s marker',
		( type ) => {
			expect(
				hasSuggestionMarkers(
					`<!-- wp:paragraph {"metadata":{"noteId":[12],"suggestion":{"type":"${ type }","noteId":12}}} -->\n<p>Hello</p>\n<!-- /wp:paragraph -->`
				)
			).toBe( true );
		}
	);
} );
