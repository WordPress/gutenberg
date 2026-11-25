import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { registerBlockType, unregisterBlockType } from '@wordpress/blocks';
import {
	registerSuggestionFormat,
	unregisterSuggestionFormats,
} from '../../inline-suggestions';
import {
	DECIDED_TEXT_MAX_CHARS,
	snapshotDecidedPayload,
} from '../decision-snapshot';

const PARAGRAPH = 'test/snapshot-paragraph';

const mark = ( id: number, kind: string, text: string ) =>
	`<mark class="wp-suggestion-${ kind }" data-suggestion-id="${ id }" data-suggestion-type="${ kind }">${ text }</mark>`;

function editorOf( blocks: Record< string, Record< string, any > > ) {
	return {
		getClientIdsWithDescendants: () => Object.keys( blocks ),
		getBlockAttributes: ( clientId: string ) => blocks[ clientId ] ?? null,
		getBlock: ( clientId: string ) =>
			blocks[ clientId ]
				? { clientId, name: PARAGRAPH, attributes: blocks[ clientId ] }
				: null,
	};
}

const payloadOf = ( operations: any[] ) => ( {
	schemaVersion: 2,
	blockName: PARAGRAPH,
	baseRevision: null,
	operations,
} );

beforeAll( () => {
	registerSuggestionFormat();
	registerBlockType( PARAGRAPH, {
		apiVersion: 3,
		title: 'Snapshot paragraph',
		category: 'text',
		attributes: {
			content: { type: 'rich-text', source: 'rich-text' },
		},
		save: () => null,
	} );
} );

afterAll( () => {
	unregisterSuggestionFormats();
	unregisterBlockType( PARAGRAPH );
} );

describe( 'snapshotDecidedPayload', () => {
	it( 'records the text of an addition and of a deletion', () => {
		const editor = editorOf( {
			a: {
				content: `One${ mark( 7, 'add', ' two' ) } ${ mark(
					8,
					'del',
					'three'
				) }`,
			},
		} );
		const inline = ( suggestionType: string ) => ( {
			type: 'inline-suggestion',
			attribute: 'content',
			suggestionType,
		} );
		expect(
			snapshotDecidedPayload(
				editor,
				7,
				payloadOf( [ inline( 'add' ) ] )
			)?.operations
		).toEqual( [ { ...inline( 'add' ), decidedText: ' two' } ] );
		expect(
			snapshotDecidedPayload(
				editor,
				8,
				payloadOf( [ inline( 'del' ) ] )
			)?.operations
		).toEqual( [ { ...inline( 'del' ), decidedText: 'three' } ] );
	} );

	it( 'records both sides of a replacement', () => {
		const editor = editorOf( {
			a: {
				content: `${ mark( 9, 'add', 'new' ) }${ mark(
					9,
					'del',
					'old'
				) } words`,
			},
		} );
		const op = {
			type: 'inline-suggestion',
			attribute: 'content',
			suggestionType: 'replace',
		};
		expect(
			snapshotDecidedPayload( editor, 9, payloadOf( [ op ] ) )?.operations
		).toEqual( [
			{ ...op, decidedText: 'new', decidedDeletedText: 'old' },
		] );
	} );

	it( 'cuts a long run and leaves a formatting change alone', () => {
		const long = 'x'.repeat( DECIDED_TEXT_MAX_CHARS + 50 );
		const editor = editorOf( {
			a: { content: mark( 7, 'add', long ) },
			b: { content: mark( 8, 'format', 'bold' ) },
		} );
		const recorded = snapshotDecidedPayload(
			editor,
			7,
			payloadOf( [
				{
					type: 'inline-suggestion',
					attribute: 'content',
					suggestionType: 'add',
				},
			] )
		)?.operations[ 0 ].decidedText;
		expect( Array.from( recorded ) ).toHaveLength( DECIDED_TEXT_MAX_CHARS );
		expect( recorded.endsWith( '…' ) ).toBe( true );
		expect(
			snapshotDecidedPayload(
				editor,
				8,
				payloadOf( [
					{
						type: 'inline-suggestion',
						attribute: 'content',
						suggestionType: 'format',
					},
				] )
			)
		).toBeNull();
	} );

	it( 'refreshes the excerpt of an inserted block', () => {
		const editor = editorOf( {
			a: { content: 'New block', metadata: { noteId: [ 5 ] } },
		} );
		const op = {
			type: 'block-insert-after',
			blockName: PARAGRAPH,
			excerpt: 'N',
		};
		expect(
			snapshotDecidedPayload( editor, 5, payloadOf( [ op ] ) )?.operations
		).toEqual( [ { ...op, excerpt: 'New block' } ] );
	} );

	it( 'returns null when there is nothing to record', () => {
		const editor = editorOf( { a: { content: 'Plain' } } );
		expect( snapshotDecidedPayload( editor, 7, null ) ).toBeNull();
		expect(
			snapshotDecidedPayload(
				editor,
				7,
				payloadOf( [
					{
						type: 'inline-suggestion',
						attribute: 'content',
						suggestionType: 'add',
					},
					{ type: 'attribute-set', attribute: 'level', after: 3 },
				] )
			)
		).toBeNull();
	} );
} );
