import { describe, expect, it } from 'vitest';
import type { Block, BlockType } from '@wordpress/blocks';
import { addMergeCallback, addTransforms } from '../note-merge';

type Attributes = Record< string, any >;

const merge = ( attributes: Attributes, attributesToMerge: Attributes ) => ( {
	content: attributes.content + attributesToMerge.content,
} );

function withNotes( settings: Record< string, unknown > ) {
	return addMergeCallback( settings as unknown as BlockType ) as unknown as {
		merge: ( a: Attributes, b: Attributes ) => Attributes;
	};
}

describe( 'addMergeCallback', () => {
	it( 'leaves block types without a merge callback unchanged', () => {
		const settings = { name: 'core/foo' } as unknown as BlockType;
		expect( addMergeCallback( settings ) ).toBe( settings );
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

describe( 'addTransforms', () => {
	const block = ( name: string, attributes: Attributes ) =>
		( { name, attributes, innerBlocks: [] } ) as unknown as Block;

	it( 'adds the note IDs of a single source block', () => {
		const result = addTransforms(
			block( 'core/heading', { content: 'two', level: 2 } ),
			block( 'core/paragraph', {
				content: 'two',
				metadata: { noteId: [ 2 ] },
			} )
		);
		expect( result.attributes ).toEqual( {
			content: 'two',
			level: 2,
			metadata: { noteId: [ 2 ] },
		} );
	} );

	it( 'leaves the result unchanged when the source blocks are an array', () => {
		const result = block( 'core/heading', { content: 'two' } );
		expect(
			addTransforms( result, [
				block( 'core/paragraph', {
					content: 'two',
					metadata: { noteId: [ 2 ] },
				} ),
			] )
		).toBe( result );
	} );

	it( 'leaves the result unchanged when the source block has no notes', () => {
		const result = block( 'core/heading', { content: 'two' } );
		expect(
			addTransforms(
				result,
				block( 'core/paragraph', { content: 'two' } )
			)
		).toBe( result );
	} );
} );
