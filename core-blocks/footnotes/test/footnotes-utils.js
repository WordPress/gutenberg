/**
 * Internal dependencies
 */
import { getFootnoteByUid, orderFootnotes } from '../footnotes-utils.js';

describe( 'footnotes utils', () => {
	describe( 'getFootnoteByUid', () => {
		it( 'should return footnote associated with the id', () => {
			const footnote = { id: 'abcd', text: 'ABCD' };
			const id = 'abcd';

			expect( getFootnoteByUid( [ footnote ], id ) ).toEqual( footnote );
		} );

		it( 'should return a footnote without text when the id is not found', () => {
			const emptyFootnote = { id: 'abcd', text: '' };
			const id = 'abcd';

			expect( getFootnoteByUid( [], id ) ).toEqual( emptyFootnote );
		} );
	} );

	describe( 'orderFootnotes', () => {
		it( 'should return ordered footnotes', () => {
			const footnote1 = { id: 'abcd1', text: 'ABCD1' };
			const footnote2 = { id: 'abcd2', text: 'ABCD2' };
			const footnotes = [ footnote1, footnote2 ];
			const orderedFootnoteUids = [ { id: footnote2.id }, { id: footnote1.id } ];

			expect( orderFootnotes( footnotes, orderedFootnoteUids ) )
				.toEqual( [ footnote2, footnote1 ] );
		} );
	} );
} );
