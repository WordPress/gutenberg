import { beforeEach, describe, expect, it, vi } from 'vitest';
import { speak } from '@wordpress/a11y';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore, storeConfig } from '..';
import { EDITOR_INTENT_SUGGEST } from '../constants';
import { installSuggestPostEditGuard } from '../suggest-post-edit-guard';
import { unlock } from '../../lock-unlock';

vi.hoisted( () => ( globalThis as any ).wpVitest.mockMatchMedia() );

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn(),
} ) );

const postTypeConfig = {
	kind: 'postType',
	name: 'post',
	baseURL: '/wp/v2/posts',
	transientEdits: { blocks: true, selection: true },
	mergedEdits: { meta: true },
	rawAttributes: [ 'title', 'excerpt', 'content' ],
};

const makePost = ( id: number ) => ( {
	id,
	type: 'post',
	title: 'Title',
	content: 'Content',
	status: 'draft',
	comment_status: 'open',
} );

/**
 * Two editors the way a page holding more than one mounts them: each has its
 * own `core/editor` (and block editor) in a sub-registry, and both reach the
 * one core-data store of the parent registry.
 *
 * @return The parent registry and the two editors' registries.
 */
function setupTwoEditors() {
	const parent: any = createRegistry();
	parent.register( coreStore );
	parent.register( noticesStore );
	parent.register( preferencesStore );
	parent.dispatch( coreStore ).addEntities( [ postTypeConfig ] );
	parent.dispatch( coreStore ).receiveEntityRecords( 'root', 'postType', [
		{
			slug: 'post',
			rest_base: 'posts',
			labels: {},
			// Suggesting needs a post type that supports notes.
			supports: { editor: [ { notes: true } ] },
		},
	] );

	const makeEditor = ( id: number ) => {
		const registry: any = createRegistry( {}, parent );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		const post = makePost( id );
		parent
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'post', post );
		registry.dispatch( editorStore ).setupEditor( post );
		return registry;
	};

	return { parent, first: makeEditor( 1 ), second: makeEditor( 2 ) };
}

const setSuggesting = ( registry: any, isSuggesting: boolean ) =>
	unlock( registry.dispatch( editorStore ) ).setEditorIntent(
		isSuggesting ? EDITOR_INTENT_SUGGEST : 'edit'
	);

/**
 * Write a locked field straight to the entity and report whether it landed.
 *
 * @param parent The registry holding core-data.
 * @param id     The post id.
 * @return Whether the edit reached the entity.
 */
function directWriteLands( parent: any, id: number ): boolean {
	const value = `closed-${ Math.random() }`;
	parent
		.dispatch( coreStore )
		.editEntityRecord( 'postType', 'post', id, { comment_status: value } );
	return (
		parent
			.select( coreStore )
			.getEntityRecordEdits( 'postType', 'post', id )?.comment_status ===
		value
	);
}

// The stores' resolvers fetch; no request may leave the test or fail it.
apiFetch.setFetchHandler( () => new Promise( () => {} ) );

// Suggesting is only offered with the Suggestion mode experiment on.
window.__experimentalSuggestionMode = true;

describe( 'installSuggestPostEditGuard with two editors', () => {
	beforeEach( () => {
		vi.mocked( speak ).mockClear();
	} );

	it( 'shares one core-data actions object between the editors', () => {
		const { parent, first, second } = setupTwoEditors();
		expect( first.dispatch( coreStore ) ).toBe(
			parent.dispatch( coreStore )
		);
		expect( second.dispatch( coreStore ) ).toBe(
			parent.dispatch( coreStore )
		);
		expect( first.select( editorStore ) ).not.toBe(
			second.select( editorStore )
		);
	} );

	it( 'guards the post of whichever editor is suggesting', () => {
		const { parent, first, second } = setupTwoEditors();
		const uninstallFirst = installSuggestPostEditGuard( first );
		const uninstallSecond = installSuggestPostEditGuard( second );

		// The editor that installed second is the one suggesting.
		setSuggesting( second, true );
		expect( directWriteLands( parent, 2 ) ).toBe( false );
		expect( directWriteLands( parent, 1 ) ).toBe( true );

		setSuggesting( second, false );
		setSuggesting( first, true );
		expect( directWriteLands( parent, 1 ) ).toBe( false );
		expect( directWriteLands( parent, 2 ) ).toBe( true );

		uninstallSecond();
		uninstallFirst();
	} );

	it( 'keeps guarding the second editor after the first one unmounts', () => {
		const { parent, first, second } = setupTwoEditors();
		const original = parent.dispatch( coreStore ).editEntityRecord;
		const uninstallFirst = installSuggestPostEditGuard( first );
		const uninstallSecond = installSuggestPostEditGuard( second );
		setSuggesting( first, true );
		setSuggesting( second, true );

		uninstallFirst();
		expect( directWriteLands( parent, 2 ) ).toBe( false );
		// The unmounted editor no longer refuses anything.
		expect( directWriteLands( parent, 1 ) ).toBe( true );
		expect( parent.dispatch( coreStore ).editEntityRecord ).not.toBe(
			original
		);

		uninstallSecond();
		expect( parent.dispatch( coreStore ).editEntityRecord ).toBe(
			original
		);
		expect( directWriteLands( parent, 2 ) ).toBe( true );
	} );

	it( 'keeps guarding the first editor after the second one unmounts', () => {
		const { parent, first, second } = setupTwoEditors();
		const original = parent.dispatch( coreStore ).editEntityRecord;
		const uninstallFirst = installSuggestPostEditGuard( first );
		const uninstallSecond = installSuggestPostEditGuard( second );
		setSuggesting( first, true );
		setSuggesting( second, true );

		uninstallSecond();
		expect( directWriteLands( parent, 1 ) ).toBe( false );
		expect( directWriteLands( parent, 2 ) ).toBe( true );
		expect( parent.dispatch( coreStore ).editEntityRecord ).not.toBe(
			original
		);

		uninstallFirst();
		expect( parent.dispatch( coreStore ).editEntityRecord ).toBe(
			original
		);
	} );

	it( 'refuses to trash only the post of the editor that is suggesting', async () => {
		const { parent, first, second } = setupTwoEditors();
		const uninstallFirst = installSuggestPostEditGuard( first );
		const uninstallSecond = installSuggestPostEditGuard( second );
		setSuggesting( second, true );

		await parent
			.dispatch( coreStore )
			.deleteEntityRecord( 'postType', 'post', 2 );
		expect( speak ).toHaveBeenCalledWith(
			"Moving to the trash isn't available while suggesting. Switch to Editing to move it to the trash.",
			'assertive'
		);

		uninstallSecond();
		uninstallFirst();
	} );

	it( 'installing twice for one editor is undone by one uninstall', () => {
		const { parent, first } = setupTwoEditors();
		const original = parent.dispatch( coreStore ).editEntityRecord;
		// The provider installs during render and again in its effect.
		installSuggestPostEditGuard( first );
		const uninstall = installSuggestPostEditGuard( first );
		uninstall();
		expect( parent.dispatch( coreStore ).editEntityRecord ).toBe(
			original
		);
	} );

	it( 'leaves a wrap another caller added later in place', () => {
		const { parent, first } = setupTwoEditors();
		const coreActions = parent.dispatch( coreStore );
		const uninstall = installSuggestPostEditGuard( first );
		setSuggesting( first, true );
		const guarded = coreActions.editEntityRecord;
		const later = ( ...args: any[] ) => guarded( ...args );
		coreActions.editEntityRecord = later;

		uninstall();
		expect( coreActions.editEntityRecord ).toBe( later );
		// The guard left inside the later wrap no longer refuses.
		expect( directWriteLands( parent, 1 ) ).toBe( true );
		coreActions.editEntityRecord = guarded;
	} );

	it( 'does not throw for an editor store without the private selectors', () => {
		const { parent } = setupTwoEditors();
		// `EditorProvider` registers its default sub-registry's store from
		// the plain config, which carries no private selectors.
		const bare: any = createRegistry( {}, parent );
		bare.register( blockEditorStore );
		bare.registerStore( editorStore.name, storeConfig );
		const post = makePost( 3 );
		parent
			.dispatch( coreStore )
			.receiveEntityRecords( 'postType', 'post', post );
		bare.dispatch( editorStore.name ).setupEditor( post );

		const uninstall = installSuggestPostEditGuard( bare );
		expect( directWriteLands( parent, 3 ) ).toBe( true );
		uninstall();
	} );
} );
