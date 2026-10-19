import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, waitFor } from '@testing-library/react';
import {
	getBlockTypes,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
import { RichText } from '@wordpress/block-editor';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { Y } from '@wordpress/sync';
import type { Block } from '@wordpress/blocks';
import { store as coreDataStore } from '../index';
import { registerEntitySyncManager } from '../entity-sync';
import { CRDT_RECORD_MAP_KEY } from '../sync';
import useEntityBlockEditor from '../hooks/use-entity-block-editor';
import { applyPostChangesToCRDTDoc } from '../utils/crdt';
import { getRootMap } from '../utils/crdt-utils';
import type { EntityBlockEditorHandler } from '../hooks/types';

vi.mock( import( '@wordpress/api-fetch' ) );

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
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

function readFirstBlockContentFromDoc( doc: Y.Doc ): string {
	const ymap = getRootMap( doc, CRDT_RECORD_MAP_KEY );
	// The record map holds the blocks as maps, with their attributes as maps.
	const yblocks = ymap.get( 'blocks' ) as Y.Array< Y.Map< Y.Map< Y.Text > > >;
	// The test's paragraph has attributes, with content.
	const attrs = yblocks.get( 0 ).get( 'attributes' )!;
	return attrs.get( 'content' )!.toString();
}

describe( 'useEntityBlockEditor RTC rich-text offset-space bug', () => {
	let crdtDoc: Y.Doc;
	let unregisterSyncManager: () => void;

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

		// A minimal entity sync manager: every edit lands in the CRDT
		// document the way the Yjs engine applies it.
		unregisterSyncManager = registerEntitySyncManager( {
			load: () => {},
			update: ( _kind, _name, _recordId, changes ) => {
				applyPostChangesToCRDTDoc(
					crdtDoc,
					changes,
					SYNCED_PROPERTIES
				);
			},
			unload: () => {},
			unloadAll: () => {},
		} );
	} );

	afterEach( () => {
		if ( vi.isFakeTimers() ) {
			// Finish selection updates before destroying their document.
			vi.runOnlyPendingTimers();
			vi.useRealTimers();
		}
		crdtDoc.destroy();
		unregisterSyncManager();
		if (
			getBlockTypes().some( ( block ) => block.name === 'core/paragraph' )
		) {
			unregisterBlockType( 'core/paragraph' );
		}
	} );

	it( 'preserves formatted paragraph content when onInput forwards blocks plus selection', async () => {
		const registry = createRegistryWithStores();
		// Both are set by the component's first render, which the test awaits.
		let blocks!: Array< Block >;
		let onInput!: EntityBlockEditorHandler;

		const TestComponent = () => {
			// Given an ID, the hook returns the blocks of the record.
			[ blocks, onInput ] = useEntityBlockEditor( 'postType', 'post', {
				id: 1,
			} ) as [ Array< Block >, EntityBlockEditorHandler, unknown ];

			return <div />;
		};

		render(
			<RegistryProvider value={ registry }>
				<TestComponent />
			</RegistryProvider>
		);

		await waitFor( () => expect( blocks ).toHaveLength( 1 ) );
		// Keep the async render setup on real timers.
		vi.useFakeTimers();

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
