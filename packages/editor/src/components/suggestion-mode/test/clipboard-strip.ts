import {
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
import { select } from '@wordpress/data';
import { applyFilters, removeFilter } from '@wordpress/hooks';
import {
	registerClipboardSuggestionStrip,
	stripSuggestionDataFromBlock,
	stripSuggestionDataFromBlocks,
} from '../clipboard-strip';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
} from '../../inline-suggestions/format';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

const marker = ( id: number | string, type: string, text: string ) =>
	`<mark class="wp-suggestion" data-suggestion-id="${ id }" data-suggestion-type="${ type }" data-author="1">${ text }</mark>`;

beforeAll( () => {
	registerSuggestionFormat();
} );

afterAll( () => {
	if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		unregisterFormatType( SUGGESTION_FORMAT_NAME );
	}
} );

describe( 'stripSuggestionDataFromBlock', () => {
	it( 'unwraps inline suggestion markers, keeping the text of every kind', () => {
		const block = {
			name: 'core/paragraph',
			attributes: {
				content: `keep ${ marker( 7, 'del', 'doomed' ) } and ${ marker(
					8,
					'add',
					'COPIED'
				) } and ${ marker( 9, 'format', 'styled' ) }`,
			},
			innerBlocks: [],
		};

		const result = stripSuggestionDataFromBlock( block );

		expect( result.attributes.content ).toBe(
			'keep doomed and COPIED and styled'
		);
		expect( result.attributes.content ).not.toContain( 'wp-suggestion' );
	} );

	it( 'drops metadata.noteId and metadata.suggestion but keeps other metadata', () => {
		const block = {
			name: 'core/paragraph',
			attributes: {
				content: 'plain',
				metadata: {
					noteId: [ 192 ],
					suggestion: { type: 'pending-insert' },
					name: 'Intro',
				},
			},
			innerBlocks: [],
		};

		const result = stripSuggestionDataFromBlock( block );

		expect( result.attributes.metadata ).toEqual( { name: 'Intro' } );
	} );

	it( 'removes the metadata object entirely when only suggestion keys were in it', () => {
		const block = {
			name: 'core/paragraph',
			attributes: {
				content: 'plain',
				metadata: { noteId: [ 192 ] },
			},
			innerBlocks: [],
		};

		expect(
			stripSuggestionDataFromBlock( block ).attributes
		).not.toHaveProperty( 'metadata' );
	} );

	it( 'strips inner blocks recursively', () => {
		const block = {
			name: 'core/group',
			attributes: {},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: {
						content: marker( 3, 'add', 'nested' ),
						metadata: { noteId: [ 3 ] },
					},
					innerBlocks: [],
				},
			],
		};

		const result = stripSuggestionDataFromBlock( block );

		expect( result.innerBlocks[ 0 ].attributes.content ).toBe( 'nested' );
		expect( result.innerBlocks[ 0 ].attributes ).not.toHaveProperty(
			'metadata'
		);
	} );

	it( 'returns the same reference when there is no suggestion state', () => {
		const block = {
			name: 'core/paragraph',
			attributes: { content: 'nothing to strip' },
			innerBlocks: [],
		};

		expect( stripSuggestionDataFromBlock( block ) ).toBe( block );
	} );

	it( 'does not mutate the source block', () => {
		const attributes = {
			content: marker( 1, 'del', 'gone' ),
			metadata: { noteId: [ 1 ] },
		};
		const block = { name: 'core/paragraph', attributes, innerBlocks: [] };

		stripSuggestionDataFromBlock( block );

		expect( block.attributes ).toBe( attributes );
		expect( attributes.content ).toContain( 'wp-suggestion' );
		expect( attributes.metadata.noteId ).toEqual( [ 1 ] );
	} );
} );

describe( 'stripSuggestionDataFromBlocks', () => {
	it( 'returns the same array reference when nothing changed', () => {
		const blocks = [
			{
				name: 'core/paragraph',
				attributes: { content: 'clean' },
				innerBlocks: [],
			},
		];

		expect( stripSuggestionDataFromBlocks( blocks ) ).toBe( blocks );
	} );

	it( 'passes non-array input through', () => {
		expect( stripSuggestionDataFromBlocks( undefined ) ).toBeUndefined();
	} );
} );

describe( 'registerClipboardSuggestionStrip', () => {
	afterEach( () => {
		removeFilter(
			'blockEditor.copiedBlocks',
			'core/editor/strip-suggestions-on-copy'
		);
	} );

	it( 'strips suggestion state through the blockEditor.copiedBlocks filter', () => {
		registerClipboardSuggestionStrip();

		const [ filtered ] = applyFilters( 'blockEditor.copiedBlocks', [
			{
				name: 'core/paragraph',
				attributes: {
					content: marker( 192, 'add', 'COPIED ' ),
					metadata: { noteId: [ 192 ] },
				},
				innerBlocks: [],
			},
		] ) as any;

		expect( filtered.attributes.content ).toBe( 'COPIED ' );
		expect( filtered.attributes ).not.toHaveProperty( 'metadata' );
	} );
} );
