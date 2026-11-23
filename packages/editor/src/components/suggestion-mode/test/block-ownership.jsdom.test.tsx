import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { render, act } from '@testing-library/react';
import type { ReactNode } from 'react';
import {
	RegistryProvider,
	createReduxStore,
	createRegistry,
} from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import {
	createPostOwnershipCheck,
	isBlockOwnedByCurrentPost,
} from '../block-ownership';
import SuggestionStoreInterceptor from '../store-interceptor';
import {
	SuggestionSessionProvider,
	useSuggestionSession,
} from '../suggestion-session';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const TEXT = 'test/owned-text';
const CONTAINER = 'test/owned-container';
const POST_CONTENT = 'core/post-content';

beforeAll( () => {
	registerBlockType( TEXT, {
		apiVersion: 3,
		title: 'Text',
		category: 'text',
		attributes: {
			content: { type: 'string', default: '' },
			metadata: { type: 'object' },
		},
		edit: () => null,
		save: () => null,
	} );
	for ( const name of [ CONTAINER, POST_CONTENT ] ) {
		registerBlockType( name, {
			apiVersion: 3,
			title: name,
			category: 'design',
			attributes: { metadata: { type: 'object' } },
			edit: () => null,
			save: () => null,
		} );
	}
} );

afterAll( () => {
	[ TEXT, CONTAINER, POST_CONTENT ].forEach( unregisterBlockType );
} );

// `setEditorIntent( 'suggest' )` reads the current post through `core`.
const stubCoreStore = () =>
	createReduxStore( 'core', {
		reducer: ( state = {} ) => state,
		selectors: {
			getCurrentUser: () => undefined,
			getRawEntityRecord: () => undefined,
			getEntityRecordEdits: () => undefined,
			getEntityRecord: () => undefined,
		},
	} );

/**
 * A registry whose root tree holds a text block and a container with
 * controlled inner blocks, the shape a synced pattern, a template part or a
 * navigation menu has in the canvas.
 *
 * @param options               Options.
 * @param options.containerName Block name of the controlled container.
 * @param options.renderingMode Editor rendering mode.
 */
function setupTree( {
	containerName = CONTAINER,
	renderingMode = 'post-only',
}: { containerName?: string; renderingMode?: string } = {} ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	registry.register( stubCoreStore() );
	registry.dispatch( editorStore ).setRenderingMode( renderingMode );

	const rootText = createBlock( TEXT, { content: 'Root' } );
	const container = createBlock( containerName );
	const innerText = createBlock( TEXT, { content: 'Inner' } );
	const innerGroup = createBlock( CONTAINER, {}, [
		createBlock( TEXT, { content: 'Nested' } ),
	] );
	const dispatch: any = registry.dispatch( blockEditorStore );
	dispatch.resetBlocks( [ rootText, container ] );
	dispatch.setHasControlledInnerBlocks( container.clientId, true );
	dispatch.replaceInnerBlocks( container.clientId, [
		innerText,
		innerGroup,
	] );

	return {
		registry,
		dispatch,
		rootText: rootText.clientId,
		container: container.clientId,
		innerText: innerText.clientId,
		innerGroup: innerGroup.clientId,
		nested: innerGroup.innerBlocks[ 0 ].clientId,
	};
}

const attributesOf = ( registry: any, clientId: string ): any =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId );

// Suggesting is only offered with the Suggestion mode experiment on.
window.__experimentalSuggestionMode = true;

describe( 'createPostOwnershipCheck', () => {
	it( 'owns root blocks, and a controlled container itself, but not what the container holds', () => {
		const tree = setupTree();
		const { owns, ownsChildrenOf } = createPostOwnershipCheck(
			tree.registry
		);

		expect( owns( tree.rootText ) ).toBe( true );
		// Its own attributes (the reference to the other entity) are saved
		// in the post.
		expect( owns( tree.container ) ).toBe( true );
		expect( owns( tree.innerText ) ).toBe( false );
		expect( owns( tree.nested ) ).toBe( false );
		expect( ownsChildrenOf( null ) ).toBe( true );
		expect( ownsChildrenOf( tree.container ) ).toBe( false );
		expect( ownsChildrenOf( tree.innerGroup ) ).toBe( false );
	} );

	it( 'owns only what Post Content holds when the template is shown', () => {
		const tree = setupTree( {
			containerName: POST_CONTENT,
			renderingMode: 'template-locked',
		} );
		const { owns } = createPostOwnershipCheck( tree.registry );

		// The root tree is the template's.
		expect( owns( tree.rootText ) ).toBe( false );
		expect( owns( tree.container ) ).toBe( false );
		expect( owns( tree.innerText ) ).toBe( true );
		expect( owns( tree.nested ) ).toBe( true );
	} );

	it( 'does not own a controlled block nested in Post Content', () => {
		const tree = setupTree( {
			containerName: POST_CONTENT,
			renderingMode: 'template-locked',
		} );
		const pattern = createBlock( CONTAINER );
		const patternText = createBlock( TEXT, { content: 'Pattern' } );
		tree.dispatch.replaceInnerBlocks( tree.container, [ pattern ] );
		tree.dispatch.setHasControlledInnerBlocks( pattern.clientId, true );
		tree.dispatch.replaceInnerBlocks( pattern.clientId, [ patternText ] );

		expect(
			isBlockOwnedByCurrentPost( tree.registry, pattern.clientId )
		).toBe( true );
		expect(
			isBlockOwnedByCurrentPost( tree.registry, patternText.clientId )
		).toBe( false );
	} );

	it( 'treats a Post Content block in the post itself as any other controlled block', () => {
		const tree = setupTree( { containerName: POST_CONTENT } );
		const { owns } = createPostOwnershipCheck( tree.registry );

		expect( owns( tree.rootText ) ).toBe( true );
		expect( owns( tree.innerText ) ).toBe( false );
	} );
} );

describe( 'SuggestionStoreInterceptor and blocks another entity owns', () => {
	function setup( options?: Parameters< typeof setupTree >[ 0 ] ) {
		const tree = setupTree( options );
		unlock( tree.registry.dispatch( editorStore ) ).setEditorIntent(
			'suggest'
		);
		let session: ReturnType< typeof useSuggestionSession >;
		function CaptureSession() {
			session = useSuggestionSession();
			return null;
		}
		const wrapper = ( { children }: { children?: ReactNode } ) => (
			<RegistryProvider value={ tree.registry }>
				<SuggestionSessionProvider>
					{ children }
				</SuggestionSessionProvider>
			</RegistryProvider>
		);
		render(
			<>
				<CaptureSession />
				<SuggestionStoreInterceptor />
			</>,
			{ wrapper }
		);
		return { ...tree, captures: () => session.getStructuralCaptures() };
	}

	async function change( callback: () => void ) {
		await act( async () => {
			callback();
		} );
		await act( async () => {
			await Promise.resolve();
		} );
	}

	it( 'writes no marker for an attribute change inside a controlled block', async () => {
		const { registry, dispatch, innerText, nested } = setup();

		await change( () => {
			dispatch.updateBlockAttributes( innerText, { content: 'Edited' } );
			dispatch.updateBlockAttributes( nested, { content: 'Edited' } );
		} );

		for ( const clientId of [ innerText, nested ] ) {
			expect( attributesOf( registry, clientId ) ).toEqual( {
				content: 'Edited',
			} );
		}
	} );

	it( 'still captures an attribute change on the controlled block itself', async () => {
		const { registry, dispatch, container } = setup();

		await change( () =>
			dispatch.updateBlockAttributes( container, {
				metadata: { name: 'Renamed' },
			} )
		);

		expect(
			attributesOf( registry, container ).metadata.suggestion
		).toMatchObject( { type: 'pending-attributes' } );
	} );

	it( 'does not propose a block inserted into a controlled block', async () => {
		const { registry, dispatch, container, captures } = setup();
		const blockEditor = registry.select( blockEditorStore );
		const inserted = createBlock( TEXT, { content: 'New' } );

		// The existing children keep their client ids, so only the new
		// block arrives.
		await change( () =>
			dispatch.replaceInnerBlocks( container, [
				...blockEditor.getBlocks( container ),
				inserted,
			] )
		);

		expect( attributesOf( registry, inserted.clientId ) ).toEqual( {
			content: 'New',
		} );
		expect( captures().has( inserted.clientId ) ).toBe( false );
	} );

	it( 'does not put back a block removed from a controlled block', async () => {
		const { registry, dispatch, innerText, captures } = setup();

		await change( () => dispatch.removeBlock( innerText, false ) );

		expect(
			registry.select( blockEditorStore ).getBlock( innerText )
		).toBeNull();
		expect( captures().size ).toBe( 0 );
	} );

	it( 'does not propose a move inside a controlled block', async () => {
		const { registry, dispatch, container, innerText, captures } = setup();

		await change( () =>
			dispatch.moveBlockToPosition( innerText, container, container, 1 )
		);

		expect( attributesOf( registry, innerText ) ).toEqual( {
			content: 'Inner',
		} );
		expect( captures().size ).toBe( 0 );
	} );

	it( 'adopts the blocks a controlled block loads instead of proposing them', async () => {
		const { registry, dispatch, container, innerText, captures } = setup();
		const loaded = createBlock( TEXT, { content: 'Loaded' } );

		await change( () =>
			dispatch.replaceInnerBlocks( container, [ loaded ] )
		);

		const blockEditor = registry.select( blockEditorStore );
		expect( blockEditor.getBlockOrder( container ) ).toEqual( [
			loaded.clientId,
		] );
		expect( blockEditor.getBlock( innerText ) ).toBeNull();
		expect( attributesOf( registry, loaded.clientId ) ).toEqual( {
			content: 'Loaded',
		} );
		expect( captures().size ).toBe( 0 );
	} );

	it( 'captures the post inside Post Content and leaves the template alone when the template is shown', async () => {
		const { registry, dispatch, rootText, innerText } = setup( {
			containerName: POST_CONTENT,
			renderingMode: 'template-locked',
		} );

		await change( () => {
			dispatch.updateBlockAttributes( rootText, { content: 'Template' } );
			dispatch.updateBlockAttributes( innerText, { content: 'Post' } );
		} );

		expect( attributesOf( registry, rootText ) ).toEqual( {
			content: 'Template',
		} );
		expect( attributesOf( registry, innerText ) ).toMatchObject( {
			content: 'Inner',
			metadata: {
				suggestion: {
					type: 'pending-attributes',
					after: { content: 'Post' },
				},
			},
		} );
	} );
} );
