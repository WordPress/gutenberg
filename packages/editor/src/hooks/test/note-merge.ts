import { describe, expect, it } from 'vitest';
import type { BlockType } from '@wordpress/blocks';
import { addMergeCallback } from '../note-merge';

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
} );
