import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import {
	registerBlockType,
	serialize,
	unregisterBlockType,
} from '@wordpress/blocks';
import type { BlockInstance } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import useCommitPendingMediaEdits from '../use-commit-pending-media-edits';

const TEMPLATE_PART_ID = 'theme//header';

const templatePart = {
	kind: 'postType',
	name: 'wp_template_part',
	id: TEMPLATE_PART_ID,
};

const pendingEdit = {
	sourceId: 12,
	sourceUrl: 'original.jpg',
	modifiers: [ { type: 'rotate', args: { angle: 90 } } ],
	previewUrl: 'blob:preview',
};

const postTypeConfig = {
	kind: 'postType',
	transientEdits: { blocks: true, selection: true, pendingMediaEdits: true },
	dirtyTransientEdits: { pendingMediaEdits: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const getMethod = ( options: Record< string, any > ) =>
	options.headers?.[ 'X-HTTP-Method-Override' ] || options.method || 'GET';

/**
 * Answers the requests a template part save and a crop make.
 *
 * @param requests    Collects `METHOD path` for every call.
 * @param saves       Collects the data of every template part save.
 * @param [editError] Rejects the `/edit` request with this.
 */
function setFetchHandler(
	requests: string[],
	saves: Array< Record< string, unknown > >,
	editError?: object
) {
	apiFetch.setFetchHandler( async ( options: Record< string, any > ) => {
		const method = getMethod( options );
		const { path, data } = options;
		requests.push( `${ method } ${ path }` );

		if ( method === 'POST' && path.startsWith( '/wp/v2/media/12/edit' ) ) {
			if ( editError ) {
				throw editError;
			}
			return { id: 13, source_url: 'cropped.jpg' };
		}
		if ( method === 'GET' && path.startsWith( '/wp/v2/media/12' ) ) {
			return {
				json: async () => ( { id: 12, source_url: 'original.jpg' } ),
			};
		}
		if (
			method === 'PUT' &&
			path.startsWith( `/wp/v2/template-parts/${ TEMPLATE_PART_ID }` )
		) {
			saves.push( data );
			return { id: TEMPLATE_PART_ID, ...data };
		}
		throw {
			code: 'unknown_path',
			message: `Unknown path: ${ method } ${ path }`,
		};
	} );
}

function setUp() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );

	const core = registry.dispatch( coreStore );
	core.addEntities( [
		{ ...postTypeConfig, name: 'post', baseURL: '/wp/v2/posts' },
		{
			...postTypeConfig,
			name: 'wp_template_part',
			baseURL: '/wp/v2/template-parts',
		},
		{
			kind: 'postType',
			name: 'attachment',
			baseURL: '/wp/v2/media',
			rawAttributes: [ 'title', 'excerpt', 'content' ],
		},
	] );
	core.receiveEntityRecords( 'postType', 'post', {
		id: 1,
		type: 'post',
		content: '',
		status: 'draft',
	} );
	core.receiveEntityRecords( 'postType', 'wp_template_part', {
		id: TEMPLATE_PART_ID,
		slug: 'header',
		theme: 'theme',
		type: 'wp_template_part',
		content: '',
	} );
	registry.dispatch( editorStore ).setupEditor( {
		id: 1,
		type: 'post',
		content: '',
		status: 'draft',
	} );

	registry.dispatch( blockEditorStore ).resetBlocks( [
		{
			clientId: 'part',
			name: 'core/template-part',
			isValid: true,
			attributes: { slug: 'header', theme: 'theme' },
			innerBlocks: [
				{
					clientId: 'image',
					name: 'test/image',
					isValid: true,
					attributes: { id: 12 },
					innerBlocks: [],
				},
			],
		} as unknown as BlockInstance,
	] );

	// Copies the template part's blocks to its entity, as its block's
	// `useEntityBlockEditor` does.
	let lastBlocks: BlockInstance[] | undefined;
	registry.subscribe( () => {
		const blocks = registry
			.select( blockEditorStore )
			.getBlocks( 'part' ) as BlockInstance[];
		if ( blocks !== lastBlocks ) {
			lastBlocks = blocks;
			core.editEntityRecord(
				'postType',
				'wp_template_part',
				TEMPLATE_PART_ID,
				{
					blocks,
					content: ( {
						blocks: edited,
					}: {
						blocks: BlockInstance[];
					} ) => serialize( edited ),
				},
				{ undoIgnore: true }
			);
		}
	} );

	unlock( registry.dispatch( editorStore ) ).setPendingMediaEdit(
		'image',
		pendingEdit
	);

	const wrapper = ( { children }: { children: ReactNode } ) => (
		<RegistryProvider value={ registry }>{ children }</RegistryProvider>
	);
	renderHook( () => useCommitPendingMediaEdits(), { wrapper } );

	return {
		registry,
		save: () =>
			registry
				.dispatch( coreStore )
				.saveEditedEntityRecord(
					'postType',
					'wp_template_part',
					TEMPLATE_PART_ID,
					{ throwOnError: true }
				),
		getPendingEdits: () =>
			unlock( registry.select( editorStore ) ).getPendingMediaEdits(
				templatePart
			),
	};
}

describe( 'useCommitPendingMediaEdits', () => {
	beforeEach( () => {
		registerBlockType( 'core/template-part', {
			title: 'Template Part',
			category: 'theme',
			apiVersion: 3,
			attributes: {
				slug: { type: 'string' },
				theme: { type: 'string' },
			},
			save: () => null,
		} );
		registerBlockType( 'test/image', {
			title: 'Image',
			category: 'media',
			apiVersion: 3,
			attributes: { id: { type: 'number' } },
			mediaEditor: {
				getMedia: ( { id } ) => ( { id } ),
				applyMedia: ( attributes, media ) => ( { id: media.id } ),
			},
			save: () => null,
		} );
	} );

	afterEach( () => {
		unregisterBlockType( 'core/template-part' );
		unregisterBlockType( 'test/image' );
	} );

	it( 'saves a crop in a template part when the template part is saved', async () => {
		const requests: string[] = [];
		const saves: Array< Record< string, unknown > > = [];
		setFetchHandler( requests, saves );
		const { registry, save, getPendingEdits } = setUp();
		const isDirty = () =>
			registry
				.select( coreStore )
				.hasEditsForEntityRecord(
					'postType',
					'wp_template_part',
					TEMPLATE_PART_ID
				);

		expect( isDirty() ).toBe( true );

		await save();

		expect(
			requests.filter( ( request ) =>
				request.startsWith( 'POST /wp/v2/media/12/edit' )
			)
		).toHaveLength( 1 );
		expect( saves ).toHaveLength( 1 );
		expect( saves[ 0 ].content ).toContain( '"id":13' );
		expect( saves[ 0 ] ).not.toHaveProperty( 'pendingMediaEdits' );
		expect( getPendingEdits() ).toEqual( {} );
		expect( isDirty() ).toBe( false );
	} );

	it( 'fails the save and keeps the crop when it cannot be saved', async () => {
		const requests: string[] = [];
		const saves: Array< Record< string, unknown > > = [];
		setFetchHandler( requests, saves, {
			code: 'rest_image_edit_failed',
			message: 'The image could not be edited.',
		} );
		const { save, getPendingEdits } = setUp();

		await expect( save() ).rejects.toThrow(
			'An edited image could not be saved. The image could not be edited.'
		);
		expect( saves ).toHaveLength( 0 );
		expect( getPendingEdits() ).toEqual( { image: pendingEdit } );
	} );
} );
