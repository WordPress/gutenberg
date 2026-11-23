import { describe, expect, it } from 'vitest';
import {
	getLatestNoteActivity,
	hasUnseenNoteActivity,
	setNotesLastSeen,
} from '../utils/unseen';
import type { NoteActivity } from '../utils/unseen';

const ME = 7;
const SOMEONE_ELSE = 9;

function makeThread( {
	id = 1,
	author = SOMEONE_ELSE,
	date,
	replies = [],
}: {
	id?: number;
	author?: number;
	date: string;
	replies?: NoteActivity[];
} ): NoteActivity & { id: number } {
	return { id, author, date_gmt: date, reply: replies };
}

describe( 'getLatestNoteActivity', () => {
	it( 'returns null without threads', () => {
		expect( getLatestNoteActivity( undefined ) ).toBeNull();
	} );

	it( 'returns the newest timestamp, counting replies', () => {
		expect(
			getLatestNoteActivity( [
				makeThread( {
					id: 1,
					date: '2026-08-01T10:00:00',
					replies: [
						makeThread( { id: 2, date: '2026-08-05T10:00:00' } ),
					],
				} ),
				makeThread( { id: 3, date: '2026-08-03T10:00:00' } ),
			] )
		).toBe( '2026-08-05T10:00:00' );
	} );
} );

describe( 'hasUnseenNoteActivity', () => {
	const threads = [
		makeThread( {
			id: 1,
			author: ME,
			date: '2026-08-01T10:00:00',
			replies: [ makeThread( { id: 2, date: '2026-08-03T10:00:00' } ) ],
		} ),
	];

	it( 'is false when the current user is unknown', () => {
		expect( hasUnseenNoteActivity( threads, undefined, undefined ) ).toBe(
			false
		);
	} );

	it( 'counts a reply from somebody else after the last seen time', () => {
		expect(
			hasUnseenNoteActivity( threads, '2026-08-02T10:00:00', ME )
		).toBe( true );
		expect(
			hasUnseenNoteActivity( threads, '2026-08-03T10:00:00', ME )
		).toBe( false );
	} );

	it( 'never counts the current user’s own activity', () => {
		expect(
			hasUnseenNoteActivity(
				[ makeThread( { author: ME, date: '2026-08-05T10:00:00' } ) ],
				undefined,
				ME
			)
		).toBe( false );
	} );
} );

describe( 'setNotesLastSeen', () => {
	it( 'adds or overwrites an entry without mutating the existing map', () => {
		const existing = { 10: '2026-08-01T10:00:00' };
		expect(
			setNotesLastSeen( existing, 11, '2026-08-02T10:00:00', 5 )
		).toEqual( { 10: '2026-08-01T10:00:00', 11: '2026-08-02T10:00:00' } );
		expect(
			setNotesLastSeen( existing, 10, '2026-08-09T10:00:00', 5 )
		).toEqual( { 10: '2026-08-09T10:00:00' } );
		expect( existing ).toEqual( { 10: '2026-08-01T10:00:00' } );
	} );

	it( 'drops the least recently seen posts past the limit', () => {
		expect(
			setNotesLastSeen(
				{
					1: '2026-08-01T10:00:00',
					2: '2026-08-02T10:00:00',
					3: '2026-08-03T10:00:00',
				},
				4,
				'2026-08-04T10:00:00',
				2
			)
		).toEqual( {
			3: '2026-08-03T10:00:00',
			4: '2026-08-04T10:00:00',
		} );
	} );
} );
