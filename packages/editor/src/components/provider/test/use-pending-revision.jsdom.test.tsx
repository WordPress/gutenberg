import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import type { ReactNode } from 'react';
import apiFetch from '@wordpress/api-fetch';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreStore } from '@wordpress/core-data';
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';
import { usePendingRevision } from '../use-pending-revision';

vi.mock( import( '@wordpress/a11y' ), () => ( {
	speak: vi.fn(),
} ) );

const NAVIGATION_MENU = { postType: 'wp_navigation', postId: 7 };
const REVISION_ID = 12;

function createRegistryWithStores() {
	const registry = createRegistry();
	registry.register( blockEditorStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.register( noticesStore );
	registry.register( preferencesStore );
	return registry;
}

function renderPendingRevision(
	registry: ReturnType< typeof createRegistry >
) {
	return renderHook( () => usePendingRevision(), {
		wrapper: ( { children }: { children: ReactNode } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		),
	} );
}

describe( 'usePendingRevision', () => {
	beforeEach( () => {
		// openRevision loads the revision IDs to find the revision's page.
		apiFetch.setFetchHandler( async () => [ { id: REVISION_ID } ] );
	} );

	afterEach( () => {
		apiFetch.setFetchHandler( async () => [] );
	} );

	it( 'opens the queued revision once its post becomes current', async () => {
		const registry = createRegistryWithStores();
		const editor = () => unlock( registry.select( editorStore ) );
		registry
			.dispatch( editorStore )
			.setEditedPost( 'wp_template', 'tt5//home' );
		renderPendingRevision( registry );

		await act( async () => {
			unlock( registry.dispatch( editorStore ) ).openRevisionOfPost( {
				...NAVIGATION_MENU,
				revisionId: REVISION_ID,
			} );
		} );

		// Still on the template: nothing opens yet.
		expect( editor().getCurrentRevisionId() ).toBeNull();
		expect( editor().getPendingRevision() ).toMatchObject( {
			...NAVIGATION_MENU,
			revisionId: REVISION_ID,
		} );

		await act( async () => {
			registry
				.dispatch( editorStore )
				.setEditedPost(
					NAVIGATION_MENU.postType,
					String( NAVIGATION_MENU.postId )
				);
		} );

		expect( editor().getCurrentRevisionId() ).toBe( REVISION_ID );
		expect( editor().getPendingRevision() ).toBeNull();
	} );

	it( 'drops the queued revision if the editor ends up on another post', async () => {
		const registry = createRegistryWithStores();
		const editor = () => unlock( registry.select( editorStore ) );
		registry
			.dispatch( editorStore )
			.setEditedPost( 'wp_template', 'tt5//home' );
		renderPendingRevision( registry );

		await act( async () => {
			unlock( registry.dispatch( editorStore ) ).openRevisionOfPost( {
				...NAVIGATION_MENU,
				revisionId: REVISION_ID,
			} );
		} );

		await act( async () => {
			registry.dispatch( editorStore ).setEditedPost( 'page', '3' );
		} );

		expect( editor().getPendingRevision() ).toBeNull();

		// A later visit to the menu opens it normally, not on the revision.
		await act( async () => {
			registry
				.dispatch( editorStore )
				.setEditedPost(
					NAVIGATION_MENU.postType,
					String( NAVIGATION_MENU.postId )
				);
		} );

		expect( editor().getCurrentRevisionId() ).toBeNull();
	} );
} );
