/**
 * External dependencies
 */
import { act, render, waitFor } from '@testing-library/react';
import {
	afterEach,
	beforeEach,
	describe,
	expect,
	it,
	jest,
} from '@jest/globals';

/**
 * WordPress dependencies
 */
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import { RichText } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { Y } from '@wordpress/sync';

/**
 * Mock sync manager accessor.
 */
jest.mock( '../sync', () => ( {
	...jest.requireActual( '../sync' ),
	getSyncManager: jest.fn(),
	LOCAL_EDITOR_ORIGIN: 'local-editor',
} ) );

/**
 * Internal dependencies
 */
import { store as coreDataStore } from '../index';
import { CRDT_RECORD_MAP_KEY, getSyncManager } from '../sync';
import useEntityBlockEditor from '../hooks/use-entity-block-editor';
import { applyPostChangesToCRDTDoc } from '../utils/crdt';
import { getRootMap } from '../utils/crdt-utils';

const mockGetSyncManager = jest.mocked( getSyncManager );

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
	syncConfig: {},
};

const postTypeEntity = {
	slug: 'post',
	rest_base: 'posts',
	labels: {
		item_updated: 'Updated Post',
		item_published: 'Post published',
		item_reverted_to_draft: 'Post reverted to draft.',
	},
};

const OLD_HTML = '<em>italic</em><em>italic</em>';
const NEW_HTML = '<em>italic</em>beta';
const TEXT_OFFSET = 10;
const SYNCED_PROPERTIES = new Set( [ 'blocks' ] );

function createRegistryWithStores() {
	const registry = createRegistry();

	registry.register( coreDataStore );
	registry.dispatch( coreDataStore ).addEntities( [ postTypeConfig ] );
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'root', 'postType', [ postTypeEntity ] );
	registry
		.dispatch( coreDataStore )
		.receiveEntityRecords( 'postType', 'post', [
			{
				id: 1,
				type: 'post',
				content: {
					raw: `<!-- wp:paragraph --><p>${ OLD_HTML }</p><!-- /wp:paragraph -->`,
					rendered: `<p>${ OLD_HTML }</p>`,
				},
				meta: {},
			},
		] );

	return registry;
}

function readFirstBlockContentFromDoc( doc ) {
	const ymap = getRootMap( doc, CRDT_RECORD_MAP_KEY );
	const yblocks = ymap.get( 'blocks' );
	const attrs = yblocks.get( 0 ).get( 'attributes' );
	return attrs.get( 'content' ).toString();
}

describe( 'useEntityBlockEditor RTC rich-text offset-space bug', () => {
	let crdtDoc;

	beforeEach( () => {
		crdtDoc = new Y.Doc();

		registerBlockType( 'core/paragraph', {
			apiVersion: 3,
			title: 'Paragraph',
			category: 'text',
			attributes: {
				content: {
					type: 'rich-text',
					source: 'rich-text',
					selector: 'p',
					role: 'content',
				},
			},
			edit: () => null,
			save: ( { attributes } ) => (
				<p>
					<RichText.Content value={ attributes.content } />
				</p>
			),
		} );

		mockGetSyncManager.mockReturnValue( {
			update: jest.fn( ( _objectType, _objectId, changes ) => {
				applyPostChangesToCRDTDoc(
					crdtDoc,
					changes,
					SYNCED_PROPERTIES
				);
			} ),
		} );
	} );

	afterEach( () => {
		crdtDoc.destroy();
		mockGetSyncManager.mockReset();
		if (
			getBlockTypes().some( ( block ) => block.name === 'core/paragraph' )
		) {
			unregisterBlockType( 'core/paragraph' );
		}
	} );

	it( 'preserves formatted paragraph content when onInput forwards blocks plus selection', async () => {
		const registry = createRegistryWithStores();
		let blocks;
		let onInput;

		const TestComponent = () => {
			[ blocks, onInput ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} );

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await waitFor( () => expect( blocks ).toHaveLength( 1 ) );

		const selection = {
			selectionStart: {
				clientId: blocks[ 0 ].clientId,
				attributeKey: 'content',
				offset: TEXT_OFFSET,
			},
			selectionEnd: {
				clientId: blocks[ 0 ].clientId,
				attributeKey: 'content',
				offset: TEXT_OFFSET,
			},
		};

		act( () => {
			onInput( blocks, { selection } );
		} );

		const nextBlocks = [
			{
				...blocks[ 0 ],
				attributes: {
					...blocks[ 0 ].attributes,
					content: NEW_HTML,
				},
			},
		];

		act( () => {
			onInput( nextBlocks, { selection } );
		} );

		expect( readFirstBlockContentFromDoc( crdtDoc ) ).toBe( NEW_HTML );
	} );
} );
