import {
	RichTextData,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import { planStoreContentEdit } from '../plan-store-content-edit';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
} from '../../inline-suggestions/format';

beforeAll( () => {
	registerSuggestionFormat();
} );

afterAll( () => {
	if (
		( select( richTextStore as any ) as any ).getFormatType(
			SUGGESTION_FORMAT_NAME
		)
	) {
		unregisterFormatType( SUGGESTION_FORMAT_NAME );
	}
} );

const SENTENCE = 'The quick brown fox jumps over the lazy dog.';
const HEAD = 'The quick brown fox ';

describe( 'planStoreContentEdit', () => {
	it( 'plans a deletion marker for the head half of a block split', () => {
		// What `__unstableSplitSelection` dispatches: the head block keeps its
		// client id and loses everything after the caret.
		const plan = planStoreContentEdit(
			{ content: SENTENCE },
			{ content: HEAD },
			{ content: HEAD },
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

	it( 'accepts RichTextData values on either side', () => {
		const plan = planStoreContentEdit(
			{ content: RichTextData.fromHTMLString( SENTENCE ) },
			{ content: RichTextData.fromHTMLString( HEAD ) },
			{ content: RichTextData.fromHTMLString( HEAD ) },
			1
		);
		expect( plan?.actions?.[ 0 ]?.type ).toBe( 'wrap-del' );
	} );

	it( 'declines a change that touches any attribute besides content', () => {
		expect(
			planStoreContentEdit(
				{ content: SENTENCE, level: 2 },
				{ content: HEAD, level: 3 },
				{ content: HEAD, level: 3 },
				1
			)
		).toBeNull();
		expect(
			planStoreContentEdit(
				{ content: SENTENCE, level: 2 },
				{ content: SENTENCE, level: 3 },
				{ level: 3 },
				1
			)
		).toBeNull();
	} );

	it( 'declines a non-string-like content value', () => {
		expect(
			planStoreContentEdit(
				{ content: SENTENCE },
				{ content: undefined },
				{ content: undefined },
				1
			)
		).toBeNull();
	} );

	it( 'declines when the planner has no action to propose', () => {
		expect(
			planStoreContentEdit(
				{ content: SENTENCE },
				{ content: SENTENCE },
				{ content: SENTENCE },
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
				{ content: 'Start' },
				{ content: 'Start one two' },
				{ content: 'Start one two' },
				1
			)
		).toBeNull();
	} );

	it( 'declines a type-over, whose plan is a deletion plus an addition', () => {
		expect(
			planStoreContentEdit(
				{ content: SENTENCE },
				{ content: HEAD + 'sleeps.' },
				{ content: HEAD + 'sleeps.' },
				1
			)
		).toBeNull();
	} );

	it( 'declines a plan that would edit an existing marker instead of opening a note', () => {
		// Growing the author's own open addition is a `grow-add`, which reuses
		// an existing note id — the reconciler only executes plans whose every
		// action opens a fresh note, so this keeps the overlay path.
		const withAddition =
			'Hello <mark data-suggestion-id="7" data-suggestion-type="add" data-author="1" class="wp-suggestion">NEW</mark>';
		expect(
			planStoreContentEdit(
				{ content: withAddition },
				{ content: withAddition.replace( 'NEW', 'NEWER' ) },
				{ content: withAddition.replace( 'NEW', 'NEWER' ) },
				1
			)
		).toBeNull();
	} );
} );
