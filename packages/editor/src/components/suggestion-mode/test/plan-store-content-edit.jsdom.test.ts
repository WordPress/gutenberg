import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { RichTextData } from '@wordpress/rich-text';
import {
	planStoreContentEdit,
	settleStoreContentRemoval,
} from '../plan-store-content-edit';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../../inline-suggestions/format';

beforeAll( () => {
	registerSuggestionFormat();
} );

afterAll( () => {
	unregisterSuggestionFormats();
} );

const SENTENCE = 'The quick brown fox jumps over the lazy dog.';
const HEAD = 'The quick brown fox ';
const rtd = ( html: string ) => RichTextData.fromHTMLString( html );

describe( 'planStoreContentEdit', () => {
	it( 'plans a deletion marker for the head half of a block split', () => {
		// What `__unstableSplitSelection` dispatches: the head block keeps its
		// client id and loses everything after the caret.
		const plan = planStoreContentEdit(
			{ content: rtd( SENTENCE ) },
			{ content: rtd( HEAD ) },
			{ content: rtd( HEAD ) },
			1
		);
		expect( plan ).toEqual( {
			kind: 'delete',
			actions: [
				{
					type: 'wrap-del',
					start: HEAD.length,
					end: SENTENCE.length,
					newNote: true,
				},
			],
		} );
	} );

	it( 'declines plain-string content, which the appliers cannot mark', () => {
		expect(
			planStoreContentEdit(
				{ content: SENTENCE },
				{ content: HEAD },
				{ content: HEAD },
				1
			)
		).toBeNull();
	} );

	it( 'declines a change that touches any attribute besides content', () => {
		expect(
			planStoreContentEdit(
				{ content: rtd( SENTENCE ), level: 2 },
				{ content: rtd( HEAD ), level: 3 },
				{ content: rtd( HEAD ), level: 3 },
				1
			)
		).toBeNull();
		expect(
			planStoreContentEdit(
				{ content: rtd( SENTENCE ), level: 2 },
				{ content: rtd( SENTENCE ), level: 3 },
				{ level: 3 },
				1
			)
		).toBeNull();
	} );

	it( 'declines a non-string-like content value', () => {
		expect(
			planStoreContentEdit(
				{ content: rtd( SENTENCE ) },
				{ content: undefined },
				{ content: undefined },
				1
			)
		).toBeNull();
	} );

	it( 'declines when the planner has no action to propose', () => {
		expect(
			planStoreContentEdit(
				{ content: rtd( SENTENCE ) },
				{ content: rtd( SENTENCE ) },
				{ content: rtd( SENTENCE ) },
				1
			)
		).toBeNull();
	} );

	it( 'declines an insertion, which the overlay still renders for the reviewer', () => {
		// A multi-line paste reaches this same seam. The overlay shows the
		// pasted text (it is the new value), so there is nothing invisible to
		// rescue and it keeps the capture it has today.
		expect(
			planStoreContentEdit(
				{ content: rtd( 'Start' ) },
				{ content: rtd( 'Start one two' ) },
				{ content: rtd( 'Start one two' ) },
				1
			)
		).toBeNull();
	} );

	it( 'declines a type-over, whose plan is a deletion plus an addition', () => {
		expect(
			planStoreContentEdit(
				{ content: rtd( SENTENCE ) },
				{ content: rtd( HEAD + 'sleeps.' ) },
				{ content: rtd( HEAD + 'sleeps.' ) },
				1
			)
		).toBeNull();
	} );

	it( 'declines a plan that would edit an existing marker instead of opening a note', () => {
		// Growing the author's own open addition is a `grow-add`, which reuses
		// an existing note id — the reconciler only executes plans whose every
		// action opens a fresh note, so this keeps the overlay path.
		const withAddition =
			'Hello <mark data-suggestion-id="7" data-suggestion-type="add" data-author="1" class="wp-suggestion-add">NEW</mark>';
		expect(
			planStoreContentEdit(
				{ content: rtd( withAddition ) },
				{ content: rtd( withAddition.replace( 'NEW', 'NEWER' ) ) },
				{ content: rtd( withAddition.replace( 'NEW', 'NEWER' ) ) },
				1
			)
		).toBeNull();
	} );
} );

describe( 'settleStoreContentRemoval', () => {
	const marker = ( type: string, author: number, text: string ) =>
		`<mark class="wp-suggestion-${ type }" data-suggestion-id="7" data-suggestion-type="${ type }" data-author="${ author }">${ text }</mark>`;

	it( "retracts the author's own addition from the removed run, so the rest plans as a deletion", () => {
		// "Hello world again" + own " and more", split after "aga".
		const previous = {
			content: rtd(
				`Hello world again${ marker( 'add', 1, ' and more' ) }`
			),
		};
		const current = { content: rtd( 'Hello world aga' ) };
		const settled = settleStoreContentRemoval(
			previous,
			current,
			current,
			1
		);
		expect( settled ).not.toBeNull();
		expect( settled?.refuse ).toBeFalsy();
		const retracted = ( settled as any ).previous;
		expect( retracted.content.toHTMLString() ).toBe( 'Hello world again' );
		// No marker of the addition is left, so its note is withdrawn.
		expect( ( settled as any ).withdrawnIds ).toEqual( [ '7' ] );

		expect(
			planStoreContentEdit( retracted, current, current, 1 )
		).toEqual( {
			kind: 'delete',
			actions: [
				{ type: 'wrap-del', start: 15, end: 17, newNote: true },
			],
		} );
	} );

	it( 'keeps the part of an own addition before the split', () => {
		const previous = {
			content: rtd( `Hello${ marker( 'add', 1, ' and more' ) }` ),
		};
		const current = {
			content: rtd( `Hello${ marker( 'add', 1, ' and' ) }` ),
		};
		const settled = settleStoreContentRemoval(
			previous,
			current,
			current,
			1
		) as any;
		expect( settled.previous.content.toHTMLString() ).toBe(
			current.content.toHTMLString()
		);
		// The head keeps part of the addition, so its note stays.
		expect( settled.withdrawnIds ).toEqual( [] );
	} );

	it.each( [
		[ "another author's addition", marker( 'add', 2, ' theirs' ) ],
		[ "another author's deletion", marker( 'del', 2, ' theirs' ) ],
		[ "the author's own deletion", marker( 'del', 1, ' mine' ) ],
		[ "the author's own format change", marker( 'format', 1, ' mine' ) ],
	] )( 'refuses a removal that would carry off %s', ( _, html ) => {
		const previous = { content: rtd( `Hello world${ html } end` ) };
		const current = { content: rtd( 'Hello wo' ) };
		expect(
			settleStoreContentRemoval( previous, current, current, 1 )
		).toEqual( { refuse: true } );
	} );

	it( 'leaves an unmarked removal and non-removals to the plain planner', () => {
		const marked = rtd( `Hello world${ marker( 'add', 2, ' theirs' ) }` );
		// The removed run is before the marker, which survives untouched.
		expect(
			settleStoreContentRemoval(
				{ content: rtd( 'Hello brave world' ) },
				{ content: rtd( 'Hello ' ) },
				{ content: rtd( 'Hello ' ) },
				1
			)
		).toBeNull();
		// An insertion.
		expect(
			settleStoreContentRemoval(
				{ content: marked },
				{ content: rtd( `X${ marked.toHTMLString() }` ) },
				{ content: rtd( `X${ marked.toHTMLString() }` ) },
				1
			)
		).toBeNull();
		// Other attributes changing alongside.
		expect(
			settleStoreContentRemoval(
				{ content: marked, level: 2 },
				{ content: rtd( 'Hello' ), level: 3 },
				{ content: rtd( 'Hello' ), level: 3 },
				1
			)
		).toBeNull();
	} );
} );
