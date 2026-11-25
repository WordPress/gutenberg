import { describe, expect, it } from 'vitest';
import { DEFAULT_NOTES_FILTERS, filterNotes } from '../notes-filters';

function note(
	id: number,
	status: string,
	suggestionStatus?: string,
	hasPayload = true
) {
	return {
		id,
		status,
		author_name: 'admin',
		content: { rendered: '' },
		meta: suggestionStatus
			? {
					_wp_suggestion: hasPayload ? '{}' : '',
					_wp_suggestion_status: suggestionStatus,
				}
			: {},
	};
}

describe( 'filterNotes by suggestion decision', () => {
	const threads = [
		note( 1, 'hold' ),
		note( 2, 'approved' ),
		note( 3, 'hold', 'pending' ),
		note( 4, 'approved', 'applied' ),
		note( 5, 'hold', 'applied-unsaved' ),
		note( 6, 'approved', 'rejected' ),
		note( 7, 'hold', 'rejected-unsaved' ),
		note( 8, 'approved', 'outdated' ),
		note( 9, 'approved', 'applied', false ),
	];
	const ids = ( status: 'accepted' | 'rejected' ) =>
		filterNotes( threads, { ...DEFAULT_NOTES_FILTERS, status } ).map(
			( thread ) => thread.id
		);

	it( 'shows accepted suggestions, saved with the post or not', () => {
		expect( ids( 'accepted' ) ).toEqual( [ 4, 5 ] );
	} );

	it( 'shows rejected suggestions, saved with the post or not', () => {
		expect( ids( 'rejected' ) ).toEqual( [ 6, 7 ] );
	} );

	it( 'keeps the selected thread', () => {
		expect(
			filterNotes(
				threads,
				{ ...DEFAULT_NOTES_FILTERS, status: 'accepted' },
				1
			).map( ( thread ) => thread.id )
		).toEqual( [ 1, 4, 5 ] );
	} );
} );
