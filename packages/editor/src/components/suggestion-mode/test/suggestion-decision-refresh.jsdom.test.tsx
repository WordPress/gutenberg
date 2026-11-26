/**
 * The decision refresh: the note list is read again after a successful post
 * save while a provisional decision is listed (#87430).
 */
import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import { RegistryProvider, createRegistry } from '@wordpress/data';
import SuggestionDecisionRefresh, {
	hasProvisionalDecision,
} from '../suggestion-decision-refresh';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const POST_ID = 7;

const note = ( id: number, status?: string ) => ( {
	id,
	meta: { _wp_suggestion_status: status },
} );

/**
 * Renders the component over stand-ins for the editor and core-data stores.
 *
 * @param options          Options.
 * @param options.notes    The cached note list.
 * @param options.supports The post type's `supports`.
 * @return The `save` driver and the `invalidateResolution` spy.
 */
function setup( {
	notes,
	supports = { editor: [ { notes: true } ] },
}: {
	notes: any[];
	supports?: Record< string, any >;
} ) {
	const registry: any = createRegistry();
	const invalidateResolution = vi.fn( () => ( { type: 'NOOP' } ) );
	registry.registerStore( 'core/editor', {
		reducer: (
			state = { saving: false, succeeded: false },
			action: any
		) => ( action.type === 'SET' ? { ...state, ...action.state } : state ),
		actions: { set: ( state: any ) => ( { type: 'SET', state } ) },
		selectors: {
			isSavingPost: ( state: any ) => state.saving,
			didPostSaveRequestSucceed: ( state: any ) => state.succeeded,
			getCurrentPostId: () => POST_ID,
			getEditedPostAttribute: () => 'post',
		},
	} );
	registry.registerStore( 'core', {
		reducer: ( state = {} ) => state,
		actions: { invalidateResolution },
		selectors: {
			getPostType: () => ( { supports } ),
			getEntityRecords: () => notes,
		},
	} );
	render(
		<RegistryProvider value={ registry }>
			<SuggestionDecisionRefresh />
		</RegistryProvider>
	);
	// Block bodies: a returned dispatch promise would make `act` async.
	const save = ( succeeded: boolean ) => {
		act( () => {
			registry.dispatch( 'core/editor' ).set( { saving: true } );
		} );
		act( () => {
			registry
				.dispatch( 'core/editor' )
				.set( { saving: false, succeeded } );
		} );
	};
	return { save, invalidateResolution };
}

describe( 'hasProvisionalDecision', () => {
	it( 'is true only when a note awaits a save', () => {
		expect(
			hasProvisionalDecision( [ note( 1, 'applied-unsaved' ) ] )
		).toBe( true );
		expect(
			hasProvisionalDecision( [
				note( 1 ),
				note( 2, 'rejected-unsaved' ),
			] )
		).toBe( true );
		expect(
			hasProvisionalDecision( [
				note( 1 ),
				note( 2, 'pending' ),
				note( 3, 'applied' ),
				note( 4, 'outdated' ),
			] )
		).toBe( false );
		expect( hasProvisionalDecision( null ) ).toBe( false );
	} );
} );

describe( 'SuggestionDecisionRefresh', () => {
	it( 'reads the notes again after a successful save with a provisional decision', () => {
		const { save, invalidateResolution } = setup( {
			notes: [ note( 1, 'applied-unsaved' ) ],
		} );
		expect( invalidateResolution ).not.toHaveBeenCalled();

		save( true );

		expect( invalidateResolution ).toHaveBeenCalledTimes( 1 );
		expect( invalidateResolution ).toHaveBeenCalledWith(
			'getEntityRecords',
			[
				'root',
				'comment',
				{ post: POST_ID, type: 'note', status: 'all', per_page: -1 },
			]
		);
	} );

	it( 'leaves the notes alone when the save failed', () => {
		const { save, invalidateResolution } = setup( {
			notes: [ note( 1, 'applied-unsaved' ) ],
		} );
		save( false );
		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );

	it( 'leaves the notes alone when no decision awaits a save', () => {
		const { save, invalidateResolution } = setup( {
			notes: [ note( 1, 'pending' ), note( 2, 'applied' ) ],
		} );
		save( true );
		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );

	it( 'does nothing for a post type without notes', () => {
		const { save, invalidateResolution } = setup( {
			notes: [ note( 1, 'applied-unsaved' ) ],
			supports: { editor: true },
		} );
		save( true );
		expect( invalidateResolution ).not.toHaveBeenCalled();
	} );
} );
