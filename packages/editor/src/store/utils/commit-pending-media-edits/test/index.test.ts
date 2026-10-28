import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { DataRegistry } from '@wordpress/data';
import commitPendingMediaEdits from '..';

vi.mock(
	import( '@wordpress/core-data' ),
	() =>
		( {
			store: 'core',
		} ) as unknown as typeof import( '@wordpress/core-data' )
);
vi.mock(
	import( '@wordpress/block-editor' ),
	() =>
		( {
			store: 'core/block-editor',
		} ) as unknown as typeof import( '@wordpress/block-editor' )
);
vi.mock(
	import( '@wordpress/blocks' ),
	() =>
		( {
			getBlockType: ( name: string ) =>
				name === 'test/image' ? { mediaEditor } : {},
		} ) as unknown as typeof import( '@wordpress/blocks' )
);
vi.mock(
	import( '@wordpress/api-fetch' ),
	() =>
		( {
			default: vi.fn(),
		} ) as unknown as typeof import( '@wordpress/api-fetch' )
);

const mockApiFetch = apiFetch as unknown as Mock;

const MODIFIERS = [ { type: 'rotate', args: { angle: 90 } } ];

const pendingEdit = (
	sourceId: number,
	modifiers: unknown[] = MODIFIERS
) => ( {
	sourceId,
	sourceUrl: `image-${ sourceId }.jpg`,
	modifiers,
	previewUrl: 'blob:preview',
} );

const CROPPED = { id: 20, source_url: 'cropped.jpg' };

const mediaEditor = {
	getMedia: ( { id }: Record< string, unknown > ) => ( {
		id: id as number,
	} ),
	applyMedia: vi.fn(
		( attributes: Record< string, unknown >, media: { id: number } ) => ( {
			id: media.id,
		} )
	),
};

/**
 * A registry with the given blocks, keyed by client ID.
 *
 * @param blocks Blocks by client ID.
 */
function createRegistry(
	blocks: Record< string, { name: string; attributes: object } >
) {
	const receiveEntityRecords = vi.fn();
	const updateBlockAttributes = vi.fn();
	const registry = {
		select: ( store: unknown ) => {
			if ( store === blockEditorStore ) {
				return {
					getBlock: ( clientId: string ) =>
						blocks[ clientId ] ?? null,
				};
			}
			return {};
		},
		resolveSelect: () => ( {
			getEntityRecord: async (
				kind: string,
				name: string,
				id: number
			) => ( {
				id,
				post: 7,
				source_url: `image-${ id }.jpg`,
			} ),
		} ),
		dispatch: ( store: unknown ) =>
			store === blockEditorStore
				? { updateBlockAttributes }
				: { receiveEntityRecords },
	} as unknown as DataRegistry;
	return { registry, receiveEntityRecords, updateBlockAttributes };
}

const image = ( id: number ) => ( { name: 'test/image', attributes: { id } } );

describe( 'commitPendingMediaEdits', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		mockApiFetch.mockResolvedValue( CROPPED );
	} );

	it( 'saves the edit and points the block at the new image', async () => {
		const { registry, receiveEntityRecords, updateBlockAttributes } =
			createRegistry( { a: image( 10 ) } );

		const { done, error } = await commitPendingMediaEdits( registry, {
			a: pendingEdit( 10 ),
		} );

		expect( error ).toBeUndefined();
		expect( done ).toEqual( [ 'a' ] );
		expect( mockApiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/10/edit',
			method: 'POST',
			data: { src: 'image-10.jpg', modifiers: MODIFIERS, post: 7 },
		} );
		expect( receiveEntityRecords ).toHaveBeenCalled();
		expect( mediaEditor.applyMedia ).toHaveBeenCalledWith(
			{ id: 10 },
			CROPPED
		);
		expect( updateBlockAttributes ).toHaveBeenCalledWith(
			[ 'a' ],
			{ a: { id: 20 } },
			{ uniqueByBlock: true }
		);
	} );

	it( 'saves an edit held by several blocks once', async () => {
		const { registry, updateBlockAttributes } = createRegistry( {
			a: image( 10 ),
			b: image( 10 ),
		} );

		await commitPendingMediaEdits( registry, {
			a: pendingEdit( 10 ),
			b: pendingEdit( 10 ),
		} );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 1 );
		expect( updateBlockAttributes ).toHaveBeenCalledWith(
			[ 'a', 'b' ],
			{ a: { id: 20 }, b: { id: 20 } },
			{ uniqueByBlock: true }
		);
	} );

	it( 'saves different edits to the same image separately', async () => {
		const { registry } = createRegistry( {
			a: image( 10 ),
			b: image( 10 ),
		} );

		await commitPendingMediaEdits( registry, {
			a: pendingEdit( 10 ),
			b: pendingEdit( 10, [ { type: 'rotate', args: { angle: 180 } } ] ),
		} );

		expect( mockApiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'drops edits that are stale', async () => {
		const { registry, updateBlockAttributes } = createRegistry( {
			replaced: image( 11 ),
			unsupported: { name: 'test/other', attributes: { id: 10 } },
		} );

		const { done } = await commitPendingMediaEdits( registry, {
			replaced: pendingEdit( 10 ),
			unsupported: pendingEdit( 10 ),
			removed: pendingEdit( 10 ),
		} );

		expect( mockApiFetch ).not.toHaveBeenCalled();
		expect( updateBlockAttributes ).not.toHaveBeenCalled();
		expect( done ).toEqual( [ 'replaced', 'unsupported', 'removed' ] );
	} );

	it( 'applies what was saved and reports what failed', async () => {
		const failure = { code: 'rest_error', message: 'Nope' };
		mockApiFetch.mockImplementation(
			async ( { path }: { path: string } ) => {
				if ( path.includes( '/11/' ) ) {
					throw failure;
				}
				return CROPPED;
			}
		);
		const { registry, updateBlockAttributes } = createRegistry( {
			a: image( 10 ),
			b: image( 11 ),
		} );

		const { done, error } = await commitPendingMediaEdits( registry, {
			a: pendingEdit( 10 ),
			b: pendingEdit( 11 ),
		} );

		expect( error ).toBe( failure );
		expect( done ).toEqual( [ 'a' ] );
		expect( updateBlockAttributes ).toHaveBeenCalledWith(
			[ 'a' ],
			{ a: { id: 20 } },
			{ uniqueByBlock: true }
		);
	} );
} );
