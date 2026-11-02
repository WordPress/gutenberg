import { describe, expect, it, vi } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import { addNoteMergeCallback } from '../note-merge';

vi.hoisted( () => globalThis.wpVitest.mockMatchMedia() );

type Attributes = Record< string, any >;

const merge = ( attributes: Attributes, attributesToMerge: Attributes ) => ( {
	content: attributes.content + attributesToMerge.content,
} );

function withNotes( settings: Record< string, unknown > ) {
	return addNoteMergeCallback(
		settings as unknown as BlockType
	) as unknown as {
		merge: ( a: Attributes, b: Attributes ) => Attributes;
	};
}

describe( 'addNoteMergeCallback', () => {
	it( 'leaves block types without a merge callback unchanged', () => {
		const settings = { name: 'core/foo' } as unknown as BlockType;
		expect( addNoteMergeCallback( settings ) ).toBe( settings );
	} );

	it( 'adds the note IDs of the merged block', () => {
		const settings = withNotes( { merge } );
		expect(
			settings.merge(
				{
					content: 'one',
					metadata: { name: 'One', noteId: [ 1 ] },
				},
				{
					content: 'two',
					metadata: { name: 'Two', noteId: [ 2, 1 ] },
				}
			)
		).toEqual( {
			content: 'onetwo',
			metadata: { name: 'One', noteId: [ 1, 2 ] },
		} );
	} );

	it( 'adds the note IDs when the first block has no metadata', () => {
		const settings = withNotes( { merge } );
		expect(
			settings.merge(
				{ content: 'one' },
				{ content: 'two', metadata: { noteId: 2 } }
			)
		).toEqual( { content: 'onetwo', metadata: { noteId: [ 2 ] } } );
	} );

	it( 'returns the merge result unchanged when the merged block has no notes', () => {
		const result = { content: 'onetwo' };
		const settings = withNotes( { merge: () => result } );
		expect(
			settings.merge(
				{ content: 'one', metadata: { noteId: [ 1 ] } },
				{ content: 'two', metadata: { name: 'Two' } }
			)
		).toBe( result );
	} );
} );
