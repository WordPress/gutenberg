import { beforeEach, describe, expect, it, vi } from 'vitest';
import apiFetch from '@wordpress/api-fetch';
import commitPendingMediaEdits, { hasPendingMediaEdits } from '..';

vi.mock( '@wordpress/core-data', () => ( { store: {} } ) );
vi.mock( '@wordpress/api-fetch', () => ( { default: vi.fn() } ) );

const MODIFIERS = [ { type: 'rotate', args: { angle: 90 } } ];

const pendingMediaEdit = ( sourceId, modifiers = MODIFIERS ) => ( {
	sourceId,
	sourceUrl: `image-${ sourceId }.jpg`,
	modifiers,
	previewUrl: 'blob:preview',
} );

const imageBlock = ( attributes, innerBlocks = [] ) => ( {
	name: 'core/image',
	attributes,
	innerBlocks,
} );

const CROPPED = {
	id: 20,
	source_url: 'cropped.jpg',
	link: 'https://example.com/cropped/',
	media_details: {
		sizes: { medium: { source_url: 'cropped-300x200.jpg' } },
	},
};

function createRegistry() {
	const receiveEntityRecords = vi.fn();
	return {
		registry: {
			resolveSelect: () => ( {
				getEntityRecord: vi.fn( async ( kind, name, id ) => ( {
					id,
					post: 7,
					source_url: `image-${ id }.jpg`,
				} ) ),
			} ),
			dispatch: () => ( { receiveEntityRecords } ),
		},
		receiveEntityRecords,
	};
}

describe( 'commitPendingMediaEdits', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		apiFetch.mockResolvedValue( CROPPED );
	} );

	it( 'saves the edit and points the block at the new image', async () => {
		const { registry, receiveEntityRecords } = createRegistry();
		const blocks = [
			imageBlock( {
				id: 10,
				url: 'image-10.jpg',
				pendingMediaEdit: pendingMediaEdit( 10 ),
			} ),
		];

		const { applyTo, error } = await commitPendingMediaEdits(
			registry,
			blocks
		);

		expect( error ).toBeUndefined();
		expect( apiFetch ).toHaveBeenCalledWith( {
			path: '/wp/v2/media/10/edit',
			method: 'POST',
			data: { src: 'image-10.jpg', modifiers: MODIFIERS, post: 7 },
		} );
		expect( receiveEntityRecords ).toHaveBeenCalled();
		expect( applyTo( blocks )[ 0 ].attributes ).toEqual( {
			id: 20,
			url: 'cropped.jpg',
			pendingMediaEdit: undefined,
		} );
	} );

	it( 'saves an edit held by several blocks once', async () => {
		const { registry } = createRegistry();
		const blocks = [
			imageBlock( { id: 10, pendingMediaEdit: pendingMediaEdit( 10 ) } ),
			imageBlock( { id: 10, pendingMediaEdit: pendingMediaEdit( 10 ) } ),
		];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect(
			applyTo( blocks ).map( ( block ) => block.attributes.id )
		).toEqual( [ 20, 20 ] );
	} );

	it( 'saves different edits to the same image separately', async () => {
		const { registry } = createRegistry();
		const blocks = [
			imageBlock( { id: 10, pendingMediaEdit: pendingMediaEdit( 10 ) } ),
			imageBlock( {
				id: 10,
				pendingMediaEdit: pendingMediaEdit( 10, [
					{ type: 'rotate', args: { angle: 180 } },
				] ),
			} ),
		];

		await commitPendingMediaEdits( registry, blocks );

		expect( apiFetch ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'keeps the selected size, or falls back to full', async () => {
		const { registry } = createRegistry();
		const blocks = [
			imageBlock( {
				id: 10,
				sizeSlug: 'medium',
				pendingMediaEdit: pendingMediaEdit( 10 ),
			} ),
			imageBlock( {
				id: 10,
				sizeSlug: 'large',
				pendingMediaEdit: pendingMediaEdit( 10 ),
			} ),
		];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );
		const [ medium, large ] = applyTo( blocks );

		expect( medium.attributes ).toMatchObject( {
			url: 'cropped-300x200.jpg',
			sizeSlug: 'medium',
		} );
		expect( large.attributes ).toMatchObject( {
			url: 'cropped.jpg',
			sizeSlug: 'full',
		} );
	} );

	it( 'points media file and attachment page links at the new image', async () => {
		const { registry } = createRegistry();
		const blocks = [
			imageBlock( {
				id: 10,
				linkDestination: 'media',
				pendingMediaEdit: pendingMediaEdit( 10 ),
			} ),
			imageBlock( {
				id: 10,
				linkDestination: 'attachment',
				pendingMediaEdit: pendingMediaEdit( 10 ),
			} ),
		];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );
		const [ media, attachment ] = applyTo( blocks );

		expect( media.attributes.href ).toBe( 'cropped.jpg' );
		expect( attachment.attributes.href ).toBe(
			'https://example.com/cropped/'
		);
	} );

	it( 'drops an edit made on an image the block no longer shows', async () => {
		const { registry } = createRegistry();
		const blocks = [
			imageBlock( { id: 11, pendingMediaEdit: pendingMediaEdit( 10 ) } ),
		];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );

		expect( apiFetch ).not.toHaveBeenCalled();
		expect( applyTo( blocks )[ 0 ].attributes ).toEqual( {
			id: 11,
			pendingMediaEdit: undefined,
		} );
	} );

	it( 'finds edits in nested blocks, but not in synced patterns', async () => {
		const { registry } = createRegistry();
		const blocks = [
			{
				name: 'core/group',
				attributes: {},
				innerBlocks: [
					imageBlock( {
						id: 10,
						pendingMediaEdit: pendingMediaEdit( 10 ),
					} ),
				],
			},
			{
				name: 'core/block',
				attributes: {},
				innerBlocks: [
					imageBlock( {
						id: 30,
						pendingMediaEdit: pendingMediaEdit( 30 ),
					} ),
				],
			},
		];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );
		const [ group, pattern ] = applyTo( blocks );

		expect( apiFetch ).toHaveBeenCalledTimes( 1 );
		expect( group.innerBlocks[ 0 ].attributes.id ).toBe( 20 );
		expect( pattern ).toBe( blocks[ 1 ] );
	} );

	it( 'applies what was saved and reports what failed', async () => {
		const { registry } = createRegistry();
		const failure = { code: 'rest_error', message: 'Nope' };
		apiFetch.mockImplementation( async ( { path } ) => {
			if ( path.includes( '/11/' ) ) {
				throw failure;
			}
			return CROPPED;
		} );
		const blocks = [
			imageBlock( { id: 10, pendingMediaEdit: pendingMediaEdit( 10 ) } ),
			imageBlock( { id: 11, pendingMediaEdit: pendingMediaEdit( 11 ) } ),
		];

		const { applyTo, error } = await commitPendingMediaEdits(
			registry,
			blocks
		);
		const [ saved, failed ] = applyTo( blocks );

		expect( error ).toBe( failure );
		expect( saved.attributes.id ).toBe( 20 );
		expect( failed ).toBe( blocks[ 1 ] );
	} );

	it( 'returns the same blocks when there is nothing to do', async () => {
		const { registry } = createRegistry();
		const blocks = [ imageBlock( { id: 10 } ) ];

		const { applyTo } = await commitPendingMediaEdits( registry, blocks );

		expect( applyTo( blocks ) ).toBe( blocks );
	} );
} );

describe( 'hasPendingMediaEdits', () => {
	it( 'is true only for an edit to the image the block shows', () => {
		expect(
			hasPendingMediaEdits( [
				imageBlock( {
					id: 10,
					pendingMediaEdit: pendingMediaEdit( 10 ),
				} ),
			] )
		).toBe( true );
		expect(
			hasPendingMediaEdits( [
				imageBlock( {
					id: 11,
					pendingMediaEdit: pendingMediaEdit( 10 ),
				} ),
			] )
		).toBe( false );
		expect( hasPendingMediaEdits( [ imageBlock( { id: 10 } ) ] ) ).toBe(
			false
		);
	} );
} );
