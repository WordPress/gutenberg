import { describe, expect, it } from 'vitest';
import getHierarchicalRows from '../get-hierarchical-rows';

type Item = {
	id: string;
	parentId?: string;
};

const getItemId = ( item: Item ) => item.id;
const getItemParentId = ( item: Item ) => item.parentId;

describe( 'getHierarchicalRows', () => {
	it( 'orders loaded items by parent while preserving sibling order and computing depth', () => {
		const rows = getHierarchicalRows(
			[
				{ id: 'child-2', parentId: 'root' },
				{ id: 'root' },
				{ id: 'child-1', parentId: 'root' },
				{ id: 'grandchild', parentId: 'child-1' },
				{ id: 'other-root' },
			],
			getItemId,
			getItemParentId
		);

		expect( rows.map( ( { id, level } ) => ( { id, level } ) ) ).toEqual( [
			{ id: 'root', level: 0 },
			{ id: 'child-2', level: 1 },
			{ id: 'child-1', level: 1 },
			{ id: 'grandchild', level: 2 },
			{ id: 'other-root', level: 0 },
		] );
	} );

	it( 'returns missing-parent, self-parenting, and cyclic items exactly once', () => {
		const items = [
			{ id: 'orphan', parentId: 'missing' },
			{ id: 'self', parentId: 'self' },
			{ id: 'cycle-a', parentId: 'cycle-b' },
			{ id: 'cycle-b', parentId: 'cycle-a' },
		];

		const rows = getHierarchicalRows( items, getItemId, getItemParentId );

		expect( rows.map( ( row ) => row.item ) ).toHaveLength( items.length );
		expect( new Set( rows.map( ( row ) => row.item ) ) ).toEqual(
			new Set( items )
		);
	} );
} );
