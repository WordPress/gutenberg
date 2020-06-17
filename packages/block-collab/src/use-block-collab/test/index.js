/**
 * External dependencies
 */
import * as yjs from 'yjs';

/**
 * Internal dependencies
 */
import setYDocBlocks from '../set-y-doc-blocks';
import yDocBlocksToArray from '../y-doc-blocks-to-array';

describe( '`useBlockCollab` Conflict Resolution', () => {
	function applyYjsTransaction( yDoc, transaction, origin ) {
		return new Promise( ( resolve ) => {
			yDoc.on( 'update', () => {
				resolve();
			} );
			yDoc.transact( transaction, origin );
		} );
	}
	function applyYjsUpdate( yDoc, update ) {
		return new Promise( ( resolve ) => {
			yDoc.on( 'update', () => {
				resolve();
			} );
			yjs.applyUpdate( yDoc, update );
		} );
	}
	async function syncRemoteBlocks(
		initialBlocks,
		localBlocks,
		remoteBlocks
	) {
		// Local doc.
		const localYDoc = new yjs.Doc();
		const localYDocBlocks = localYDoc.getMap( 'blocks' );
		await applyYjsTransaction(
			localYDoc,
			() => {
				localYDocBlocks.set( 'order', new yjs.Map() );
				localYDocBlocks.set( 'byClientId', new yjs.Map() );
			},
			1
		);

		// Remote doc.
		const remoteYDoc = new yjs.Doc();
		const remoteYDocBlocks = remoteYDoc.getMap( 'blocks' );

		// Initialize both docs to the initial blocks.
		await applyYjsTransaction(
			localYDoc,
			() => {
				setYDocBlocks( localYDocBlocks, initialBlocks );
			},
			1
		);
		await applyYjsUpdate(
			remoteYDoc,
			yjs.encodeStateAsUpdate( localYDoc )
		);

		// Local edit.
		if ( initialBlocks !== localBlocks )
			await applyYjsTransaction(
				localYDoc,
				() => {
					setYDocBlocks( localYDocBlocks, localBlocks );
				},
				1
			);

		// Remote edit.
		if ( initialBlocks !== remoteBlocks ) {
			await applyYjsTransaction(
				remoteYDoc,
				() => {
					setYDocBlocks( remoteYDocBlocks, remoteBlocks );
				},
				2
			);

			// Merge remote edit into local edit.
			await applyYjsUpdate(
				localYDoc,
				yjs.encodeStateAsUpdate( remoteYDoc )
			);
		}

		return yDocBlocksToArray( localYDocBlocks );
	}

	it( 'Syncs a remote update to a single block.', async () => {
		const initialBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const localBlocks = initialBlocks;
		const remoteBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
		];
		const expectedBlocks = remoteBlocks;
		expect(
			await syncRemoteBlocks( initialBlocks, localBlocks, remoteBlocks )
		).toEqual( expectedBlocks );
	} );

	it( 'Syncs a new local block and a remote update to a single block.', async () => {
		const initialBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const localBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'new',
				},
				innerBlocks: [],
			},
		];
		const remoteBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
		];
		const expectedBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'new',
				},
				innerBlocks: [],
			},
		];
		expect(
			await syncRemoteBlocks( initialBlocks, localBlocks, remoteBlocks )
		).toEqual( expectedBlocks );
	} );

	it( 'Syncs a local deletion of multiple blocks and a local update to a single block.', async () => {
		const initialBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '3',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const localBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
		];
		const remoteBlocks = initialBlocks;
		const expectedBlocks = localBlocks;
		expect(
			await syncRemoteBlocks( initialBlocks, localBlocks, remoteBlocks )
		).toEqual( expectedBlocks );
	} );

	it( 'Syncs a local block move and a remote update to it.', async () => {
		const initialBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const localBlocks = [
			{
				clientId: '2',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const remoteBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
		];
		const expectedBlocks = [
			{
				clientId: '2',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		expect(
			await syncRemoteBlocks( initialBlocks, localBlocks, remoteBlocks )
		).toEqual( expectedBlocks );
	} );

	it( 'Syncs a local block move to inner blocks and a remote update to it.', async () => {
		const initialBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
		];
		const localBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [
					{
						clientId: '2',
						attributes: {
							content: 'initial',
						},
						innerBlocks: [],
					},
				],
			},
		];
		const remoteBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [],
			},
			{
				clientId: '2',
				attributes: {
					content: 'updated',
				},
				innerBlocks: [],
			},
		];
		const expectedBlocks = [
			{
				clientId: '1',
				attributes: {
					content: 'initial',
				},
				innerBlocks: [
					{
						clientId: '2',
						attributes: {
							content: 'updated',
						},
						innerBlocks: [],
					},
				],
			},
		];
		expect(
			await syncRemoteBlocks( initialBlocks, localBlocks, remoteBlocks )
		).toEqual( expectedBlocks );
	} );
} );
