/**
 * WordPress dependencies
 */
import { Y } from '@wordpress/sync';

/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';

jest.mock( 'uuid', () => ( {
	v4: () => 'mocked-uuid',
} ) );

jest.mock( '@wordpress/blocks', () => {
	const actual = jest.requireActual( '@wordpress/blocks' ) as Record<
		string,
		unknown
	>;

	return {
		...actual,
		__unstableSerializeAndClean: ( blocks: unknown ) =>
			JSON.stringify( blocks ),
		getBlockTypes: () => [
			{
				name: 'test/object-query-card',
				attributes: {
					hero: {
						type: 'object',
						query: {
							headline: { type: 'string' },
							caption: { type: 'string' },
						},
					},
				},
			},
		],
	};
} );

/**
 * Internal dependencies
 */
import { applyPostChangesToCRDTDoc, getPostChangesFromCRDTDoc } from '../crdt';
import {
	mergeCrdtBlocks,
	type Block,
	type YBlock,
	type YBlockAttributes,
} from '../crdt-blocks';
import { getRootMap } from '../crdt-utils';
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import type { Post } from '../../entity-types/post';

const syncedProperties = new Set( [ 'blocks' ] );

function objectQueryBlock( hero: {
	headline?: string;
	caption?: string;
} ): Block {
	return {
		name: 'test/object-query-card',
		attributes: {
			hero,
		},
		innerBlocks: [],
		clientId: 'object-query-card-1',
	};
}

function getHeroFromBlocks( yblocks: Y.Array< YBlock > ) {
	const attributes = yblocks.get( 0 ).get( 'attributes' ) as YBlockAttributes;

	return attributes.get( 'hero' ) as Y.Map< unknown >;
}

function getHeroFromDoc( doc: Y.Doc ) {
	const record = getRootMap< { blocks: Y.Array< YBlock > } >(
		doc,
		CRDT_RECORD_MAP_KEY
	);
	const yblocks = record.get( 'blocks' );

	if ( ! ( yblocks instanceof Y.Array ) ) {
		throw new Error( 'Expected CRDT doc to contain blocks.' );
	}

	return getHeroFromBlocks( yblocks );
}

function applyRemoteUpdate( receiver: Y.Doc, sender: Y.Doc ) {
	Y.applyUpdate( receiver, Y.encodeStateAsUpdate( sender ) );
}

describe( 'object+query stale snapshot repro', () => {
	it( 'mergeCrdtBlocks preserves a remote sibling object property update', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		const blocksA = docA.getArray< YBlock >();
		const blocksB = docB.getArray< YBlock >();
		const initialBlocks = [
			objectQueryBlock( {
				headline: 'headline before',
				caption: 'caption before',
			} ),
		];

		mergeCrdtBlocks( blocksA, initialBlocks, null );
		applyRemoteUpdate( docB, docA );

		const staleLocalSnapshot = [
			objectQueryBlock( {
				headline: 'headline from user A',
				caption: 'caption before',
			} ),
		];
		const remoteCaptionUpdate = [
			objectQueryBlock( {
				headline: 'headline before',
				caption: 'caption from user B',
			} ),
		];

		mergeCrdtBlocks( blocksB, remoteCaptionUpdate, null );
		applyRemoteUpdate( docA, docB );
		expect( getHeroFromBlocks( blocksA ).get( 'caption' ) ).toBe(
			'caption from user B'
		);

		mergeCrdtBlocks( blocksA, staleLocalSnapshot, null );

		expect( getHeroFromBlocks( blocksA ).toJSON() ).toEqual( {
			headline: 'headline from user A',
			caption: 'caption from user B',
		} );
	} );

	it( 'mergeCrdtBlocks preserves a remote sibling object property delete', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		const blocksA = docA.getArray< YBlock >();
		const blocksB = docB.getArray< YBlock >();
		const initialBlocks = [
			objectQueryBlock( {
				headline: 'headline before',
				caption: 'caption before',
			} ),
		];

		mergeCrdtBlocks( blocksA, initialBlocks, null );
		applyRemoteUpdate( docB, docA );

		const staleLocalSnapshot = [
			objectQueryBlock( {
				headline: 'headline from user A',
				caption: 'caption before',
			} ),
		];
		const remoteCaptionDelete = [
			objectQueryBlock( {
				headline: 'headline before',
			} ),
		];

		mergeCrdtBlocks( blocksB, remoteCaptionDelete, null );
		applyRemoteUpdate( docA, docB );
		expect( getHeroFromBlocks( blocksA ).has( 'caption' ) ).toBe( false );

		mergeCrdtBlocks( blocksA, staleLocalSnapshot, null );

		expect( getHeroFromBlocks( blocksA ).toJSON() ).toEqual( {
			headline: 'headline from user A',
		} );
	} );

	it( 'post CRDT adapter preserves remote object+query sibling changes', () => {
		const docA = new Y.Doc();
		const docB = new Y.Doc();
		const initialBlocks = [
			objectQueryBlock( {
				headline: 'headline before',
				caption: 'caption before',
			} ),
		];

		applyPostChangesToCRDTDoc(
			docA,
			{ blocks: initialBlocks },
			syncedProperties
		);
		applyRemoteUpdate( docB, docA );

		const staleLocalSnapshot = [
			objectQueryBlock( {
				headline: 'headline from user A',
				caption: 'caption before',
			} ),
		];
		const remoteCaptionUpdate = [
			objectQueryBlock( {
				headline: 'headline before',
				caption: 'caption from user B',
			} ),
		];

		applyPostChangesToCRDTDoc(
			docB,
			{ blocks: remoteCaptionUpdate },
			syncedProperties
		);
		applyRemoteUpdate( docA, docB );
		expect( getHeroFromDoc( docA ).get( 'caption' ) ).toBe(
			'caption from user B'
		);

		applyPostChangesToCRDTDoc(
			docA,
			{ blocks: staleLocalSnapshot },
			syncedProperties
		);

		const changes = getPostChangesFromCRDTDoc(
			docA,
			{ blocks: initialBlocks } as unknown as Post,
			syncedProperties
		);

		expect( ( changes.blocks as Block[] )[ 0 ].attributes.hero ).toEqual( {
			headline: 'headline from user A',
			caption: 'caption from user B',
		} );
	} );
} );
