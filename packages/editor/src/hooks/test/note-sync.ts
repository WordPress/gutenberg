import { describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import { addNoteIdSchema } from '../note-sync';

const noteId = {
	type: 'array',
	items: { type: 'number' },
	uniqueItems: true,
};

function withNoteIdSchema( attributes: BlockType[ 'attributes' ] ) {
	const settings: Pick< BlockType, 'name' | 'attributes' > = {
		name: 'core/paragraph',
		attributes,
	};

	// The filter only reads the attributes.
	return addNoteIdSchema( settings as BlockType ).attributes;
}

describe( 'addNoteIdSchema', () => {
	it( 'declares the note IDs as a list of unique items', () => {
		expect(
			withNoteIdSchema( {
				content: { type: 'rich-text' },
				metadata: { type: 'object' },
			} )
		).toEqual( {
			content: { type: 'rich-text' },
			metadata: { type: 'object', properties: { noteId } },
		} );
	} );

	it( 'adds the metadata attribute when the block type has none yet', () => {
		expect( withNoteIdSchema( {} ) ).toEqual( {
			metadata: { type: 'object', properties: { noteId } },
		} );
	} );

	it( 'keeps the metadata definition of the block type', () => {
		expect(
			withNoteIdSchema( {
				metadata: {
					type: 'object',
					default: { name: 'Intro' },
					properties: { name: { type: 'string' } },
				},
			} )
		).toEqual( {
			metadata: {
				type: 'object',
				default: { name: 'Intro' },
				properties: { name: { type: 'string' }, noteId },
			},
		} );
	} );

	it( 'does not change the settings it is given', () => {
		const attributes = { metadata: { type: 'object' } };
		withNoteIdSchema( attributes );

		expect( attributes ).toEqual( { metadata: { type: 'object' } } );
	} );
} );
