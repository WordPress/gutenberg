/**
 * The overlap matrix: which gestures may land on text that already carries
 * another suggestion's marker, now that each marker kind has its own format.
 */
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { create } from '@wordpress/rich-text';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../format';
import { classifyOverlap } from '../overlap';

const OWN = '1';
const OTHER = '2';

const mark = (
	kind: 'add' | 'del' | 'format',
	id: number,
	inner: string,
	author = OTHER
) =>
	`<mark data-suggestion-id="${ id }" data-suggestion-type="${ kind }" data-author="${ author }" class="wp-suggestion-${ kind }">${ inner }</mark>`;

/*
 * "ab" + a run "CDEF" carrying the marker under test + "gh". The run spans
 * offsets 2-6.
 */
const fixture = ( kind: 'add' | 'del' | 'format', author = OTHER ) =>
	create( { html: `ab${ mark( kind, 7, 'CDEF', author ) }gh` } ).formats;

type Gesture = 'insert' | 'delete' | 'format' | 'type-over';

const verdict = (
	formats: any,
	gesture: Gesture,
	start: number,
	end = start,
	authorToken: string | null = OWN
) => classifyOverlap( formats, { gesture, start, end, authorToken } );

describe( 'classifyOverlap', () => {
	beforeAll( () => {
		registerSuggestionFormat();
	} );

	afterAll( () => {
		unregisterSuggestionFormats();
	} );

	it( 'allows any gesture on unmarked text', () => {
		const formats = create( { text: 'abcdef' } ).formats;
		for ( const gesture of [
			'insert',
			'delete',
			'format',
			'type-over',
		] as Gesture[] ) {
			expect( verdict( formats, gesture, 1, 3 ).verdict ).toBe( 'allow' );
		}
	} );

	/*
	 * Each row: gesture, range, expected verdict and reason, for a run of
	 * another author's marker of each kind.
	 */
	const cases: Array<
		[
			string,
			'add' | 'del' | 'format',
			Gesture,
			number,
			number,
			'allow' | 'refuse',
			string?,
		]
	> = [
		// Insert at a caret.
		[
			'insert inside an addition',
			'add',
			'insert',
			4,
			4,
			'refuse',
			'add-in-add',
		],
		[
			'insert at an addition’s trailing edge',
			'add',
			'insert',
			6,
			6,
			'allow',
		],
		[
			'insert at an addition’s leading edge',
			'add',
			'insert',
			2,
			2,
			'allow',
		],
		[
			'insert inside a deletion',
			'del',
			'insert',
			4,
			4,
			'refuse',
			'insert-in-del',
		],
		[
			'insert at a deletion’s trailing edge',
			'del',
			'insert',
			6,
			6,
			'allow',
		],
		[
			'insert inside a formatting change',
			'format',
			'insert',
			4,
			4,
			'allow',
		],
		// Delete a range.
		[ 'delete inside an addition', 'add', 'delete', 3, 5, 'allow' ],
		[ 'delete an addition and plain text', 'add', 'delete', 0, 4, 'allow' ],
		[
			'delete inside a deletion',
			'del',
			'delete',
			3,
			5,
			'refuse',
			'del-over-del',
		],
		[
			'delete across a deletion',
			'del',
			'delete',
			0,
			4,
			'refuse',
			'del-over-del',
		],
		[
			'delete inside a formatting change',
			'format',
			'delete',
			3,
			5,
			'allow',
		],
		[
			'delete across a formatting change',
			'format',
			'delete',
			0,
			4,
			'allow',
		],
		// Toggle a format over a range.
		[ 'format inside an addition', 'add', 'format', 3, 5, 'allow' ],
		[ 'format the whole addition', 'add', 'format', 2, 6, 'allow' ],
		[
			'format across an addition’s edge',
			'add',
			'format',
			0,
			4,
			'refuse',
			'format-straddles-add',
		],
		[ 'format inside a deletion', 'del', 'format', 3, 5, 'allow' ],
		[ 'format across a deletion', 'del', 'format', 0, 4, 'allow' ],
		[
			'format inside a formatting change',
			'format',
			'format',
			3,
			5,
			'refuse',
			'format-on-format',
		],
		[
			'format across a formatting change',
			'format',
			'format',
			0,
			4,
			'refuse',
			'format-on-format',
		],
		// Type over a selection.
		[
			'type over inside an addition',
			'add',
			'type-over',
			3,
			5,
			'refuse',
			'add-in-add',
		],
		[
			'type over inside a deletion',
			'del',
			'type-over',
			3,
			5,
			'refuse',
			'del-over-del',
		],
		[
			'type over inside a formatting change',
			'format',
			'type-over',
			3,
			5,
			'allow',
		],
	];

	it.each( cases )(
		'%s by another author',
		( _label, kind, gesture, start, end, expected, reason ) => {
			const result = verdict( fixture( kind ), gesture, start, end );
			expect( result.verdict ).toBe( expected );
			if ( expected === 'refuse' ) {
				expect( result.reason ).toBe( reason );
				expect( result.blocking ).toEqual( {
					id: '7',
					kind,
					authorId: OTHER,
				} );
			} else {
				expect( result.blocking ).toBeUndefined();
			}
		}
	);

	it( 'leaves the author’s own markers to the merge paths', () => {
		// Typing in or deleting across one's own markers is handled before
		// the classifier is asked (grow, revise, delete across own markers).
		// Whatever reaches it over an own add or del run is declined.
		expect( verdict( fixture( 'add', OWN ), 'delete', 3, 5 ).verdict ).toBe(
			'refuse'
		);
		expect( verdict( fixture( 'del', OWN ), 'delete', 3, 5 ).verdict ).toBe(
			'refuse'
		);
		expect( verdict( fixture( 'del', OWN ), 'delete', 3, 5 ).reason ).toBe(
			'own-marker'
		);
		// A sibling addition next to one's own deletion is fine.
		expect( verdict( fixture( 'del', OWN ), 'insert', 4, 4 ).verdict ).toBe(
			'allow'
		);
		// A deletion over one's own formatting change is a separate
		// suggestion on the same text.
		expect(
			verdict( fixture( 'format', OWN ), 'delete', 3, 5 ).verdict
		).toBe( 'allow' );
	} );

	it( 'treats an unknown author as matching only unauthored markers', () => {
		const unauthored = create( {
			html: `ab<mark data-suggestion-id="7" data-suggestion-type="del" class="wp-suggestion-del">CDEF</mark>gh`,
		} ).formats;
		expect( verdict( unauthored, 'delete', 3, 5, null ).reason ).toBe(
			'own-marker'
		);
		expect( verdict( fixture( 'del' ), 'delete', 3, 5, null ).reason ).toBe(
			'del-over-del'
		);
	} );

	it( 'reports a replacement’s halves by their kind', () => {
		const formats = create( {
			html: `a${ mark( 'add', 9, 'NEW' ) }${ mark( 'del', 9, 'old' ) }z`,
		} ).formats;
		expect( verdict( formats, 'insert', 2, 2 ).reason ).toBe(
			'add-in-add'
		);
		expect( verdict( formats, 'insert', 5, 5 ).reason ).toBe(
			'insert-in-del'
		);
		// The caret between the halves is a trailing edge of the add half
		// and a leading edge of the del half.
		expect( verdict( formats, 'insert', 4, 4 ).verdict ).toBe( 'allow' );
	} );

	it( 'names the blocking marker in a nested stack', () => {
		// A deletion by author 3 nested in an addition by author 2: deleting
		// over the nested deletion is blocked by the deletion, not the add.
		const formats = create( {
			html: `a${ mark(
				'add',
				4,
				`bc${ mark( 'del', 5, 'de', '3' ) }f`
			) }g`,
		} ).formats;
		expect( verdict( formats, 'delete', 2, 5 ) ).toEqual( {
			verdict: 'refuse',
			reason: 'del-over-del',
			blocking: { id: '5', kind: 'del', authorId: '3' },
		} );
		// Formatting inside the addition, over the nested deletion, is fine.
		expect( verdict( formats, 'format', 2, 5 ).verdict ).toBe( 'allow' );
	} );

	it( 'tolerates a missing formats array and an out-of-range span', () => {
		expect( verdict( undefined, 'delete', 0, 3 ).verdict ).toBe( 'allow' );
		expect( verdict( fixture( 'add' ), 'insert', 0, 0 ).verdict ).toBe(
			'allow'
		);
		expect( verdict( fixture( 'add' ), 'insert', 8, 8 ).verdict ).toBe(
			'allow'
		);
	} );
} );
