import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { addFilter, removeFilter } from '@wordpress/hooks';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { Block } from '@wordpress/blocks';
import { serializeCopiedBlocks } from '../utils';

const BLOCK = 'test/copied-block';
const FILTER = 'test/serialize-copied-blocks';

beforeAll( () => {
	registerBlockType( BLOCK, {
		apiVersion: 3,
		title: 'Copied block',
		category: 'text',
		attributes: {
			content: { type: 'string' },
			secret: { type: 'string' },
		},
		edit: () => null,
		save: () => null,
	} );
} );

afterAll( () => {
	unregisterBlockType( BLOCK );
} );

afterEach( () => {
	removeFilter( 'blockEditor.copiedBlocks', FILTER );
} );

describe( 'serializeCopiedBlocks', () => {
	it( 'serializes the blocks as they are when nothing filters them', () => {
		const block = createBlock( BLOCK, { content: 'a', secret: 'b' } );

		expect( serializeCopiedBlocks( [ block ] ) ).toBe(
			`<!-- wp:${ BLOCK } {"content":"a","secret":"b"} /-->`
		);
	} );

	it( 'serializes what the blockEditor.copiedBlocks filter returns', () => {
		addFilter( 'blockEditor.copiedBlocks', FILTER, ( blocks: Block[] ) =>
			blocks.map( ( { attributes, ...block } ) => ( {
				...block,
				attributes: { content: attributes.content },
			} ) )
		);
		const block = createBlock( BLOCK, { content: 'a', secret: 'b' } );

		expect( serializeCopiedBlocks( [ block ] ) ).toBe(
			`<!-- wp:${ BLOCK } {"content":"a"} /-->`
		);
	} );
} );
