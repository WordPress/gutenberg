import { describe, expect, it } from 'vitest';
import { DEFAULT_NOTES_FILTERS, filterNotes } from '../notes-filters';

const note = (
	id: number,
	author: number,
	status: string,
	text: string,
	reply: ReturnType< typeof note >[] = []
) => ( {
	id,
	author,
	author_name: `Author ${ author }`,
	status,
	content: { rendered: `<p>${ text }</p>` },
	reply,
} );

const threads = [
	note( 1, 1, 'hold', 'Fix the <strong>heading</strong>' ),
	note( 2, 2, 'approved', 'Looks good', [
		note( 3, 1, 'approved', 'Thanks!' ),
	] ),
	note( 4, 2, 'hold', 'Swap the image' ),
];

const ids = ( result: typeof threads ) => result.map( ( { id } ) => id );

describe( 'filterNotes', () => {
	it( 'returns every thread without active filters', () => {
		expect( filterNotes( threads, DEFAULT_NOTES_FILTERS ) ).toBe( threads );
	} );

	it( 'searches note and reply text, ignoring markup and case', () => {
		expect(
			ids(
				filterNotes( threads, {
					...DEFAULT_NOTES_FILTERS,
					search: 'THE HEADING',
				} )
			)
		).toEqual( [ 1 ] );
		expect(
			ids(
				filterNotes( threads, {
					...DEFAULT_NOTES_FILTERS,
					search: 'thanks',
				} )
			)
		).toEqual( [ 2 ] );
	} );

	it( 'filters by status', () => {
		expect(
			ids(
				filterNotes( threads, {
					...DEFAULT_NOTES_FILTERS,
					status: 'approved',
				} )
			)
		).toEqual( [ 2 ] );
	} );

	it( 'matches an author who wrote the note or a reply', () => {
		expect(
			ids(
				filterNotes( threads, {
					...DEFAULT_NOTES_FILTERS,
					author: '1',
				} )
			)
		).toEqual( [ 1, 2 ] );
	} );

	it( 'combines filters and keeps the selected thread', () => {
		const filters = {
			search: 'swap',
			status: 'hold' as const,
			author: '2',
		};
		expect( ids( filterNotes( threads, filters ) ) ).toEqual( [ 4 ] );
		expect( ids( filterNotes( threads, filters, 1 ) ) ).toEqual( [ 1, 4 ] );
	} );
} );
