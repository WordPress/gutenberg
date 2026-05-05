/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import SuggestionAutoSave, { operationsForEntry } from '../auto-save';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

// jest.mock factories may only reference variables prefixed with `mock`.
const mockCreateSuggestion = jest.fn();
const mockUpdateSuggestion = jest.fn();
const mockDeleteSuggestion = jest.fn();

jest.mock( '../provider', () => {
	const actual = jest.requireActual( '../provider' );
	return {
		...actual,
		useSuggestionsProvider: () => ( {
			createSuggestion: mockCreateSuggestion,
			updateSuggestion: mockUpdateSuggestion,
			deleteSuggestion: mockDeleteSuggestion,
		} ),
	};
} );

const createSuggestion = mockCreateSuggestion;
const updateSuggestion = mockUpdateSuggestion;
const deleteSuggestion = mockDeleteSuggestion;

beforeEach( () => {
	createSuggestion.mockReset();
	updateSuggestion.mockReset();
	deleteSuggestion.mockReset();
	jest.useFakeTimers();
} );

afterEach( () => {
	jest.useRealTimers();
} );

function renderInSuggestMode( ui ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( coreStore );
	registry.register( editorStore );
	registry.dispatch( editorStore ).setEditorIntent( 'suggest' );

	const wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>{ children }</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	return { registry, ...render( ui, { wrapper } ) };
}

// Seed a comment record so `getEntityRecord( 'root', 'comment', id )` resolves
// without an HTTP fetch — mirrors what `useNoteThreads`'s entity query would
// have populated by the time a suggestion is in flight.
function seedComment( registry, comment ) {
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'comment', [ comment ] );
}

// Test harness exposes the overlay API via a render-prop ref so tests can
// drive the reducer directly.
let overlayHandle;
function CaptureOverlay() {
	overlayHandle = useSuggestionOverlay();
	return null;
}

async function flushPromises() {
	await act( async () => {
		// Resolve any pending microtasks queued by setTimeout's await chain.
		await Promise.resolve();
	} );
}

describe( 'SuggestionAutoSave', () => {
	it( 'POSTs a new suggestion after the debounce window', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );

		renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		// Before the debounce window: no POST.
		expect( createSuggestion ).not.toHaveBeenCalled();

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( createSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				clientId: 'a',
				blockName: 'core/paragraph',
				operations: expect.arrayContaining( [
					expect.objectContaining( { attribute: 'content' } ),
				] ),
			} )
		);
	} );

	it( 'updates the same comment on subsequent edits', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );

		renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// User keeps typing.
		act( () => {
			overlayHandle.setOverlayAttributes( 'a', {
				content: 'Hello world',
			} );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				commentId: 42,
				operations: expect.arrayContaining( [
					expect.objectContaining( {
						attribute: 'content',
						after: 'Hello world',
					} ),
				] ),
			} )
		);
	} );

	it( 'deletes the comment when the overlay returns to baseline', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		deleteSuggestion.mockResolvedValue( undefined );

		renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		// User reverts the overlay back to the baseline.
		act( () => {
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hi' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( deleteSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: 42 } );
	} );

	it( 'does not duplicate work when the user keeps typing during an in-flight save', async () => {
		// `createSuggestion` resolves only when we explicitly let it.
		let resolveCreate;
		createSuggestion.mockImplementation(
			() =>
				new Promise( ( resolve ) => {
					resolveCreate = resolve;
				} )
		);
		updateSuggestion.mockResolvedValue( { id: 42 } );

		renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();

		// Save_A is in flight. User keeps typing.
		act( () => {
			overlayHandle.setOverlayAttributes( 'a', {
				content: 'Hello world',
			} );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();

		// We must not have issued a duplicate create — the second sync is
		// queued behind the in-flight create.
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledTimes( 0 );

		// Let save_A complete; the queued sync_B should now run as an update
		// on the just-issued comment id.
		await act( async () => {
			resolveCreate( { id: 42 } );
		} );
		await flushPromises();
		await flushPromises();
		await flushPromises();

		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( {
				commentId: 42,
				operations: expect.arrayContaining( [
					expect.objectContaining( {
						after: 'Hello world',
					} ),
				] ),
			} )
		);
	} );

	it( 'creates a fresh suggestion when the linked note has been resolved', async () => {
		// First create resolves; second create resolves with a different id so
		// we can assert the overlay's commentId rotated.
		createSuggestion
			.mockResolvedValueOnce( { id: 42 } )
			.mockResolvedValueOnce( { id: 43 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );

		const { registry } = renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		// User A's first edit: bold suggestion. Auto-save creates note 42.
		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		// User B accepts note 42 — server flips status to 'approved'. Seed
		// the resolved comment in the registry so the next sync sees it.
		seedComment( registry, { id: 42, status: 'approved' } );

		// User A keeps editing the same block (different attribute change).
		act( () => {
			overlayHandle.setOverlayAttributes( 'a', {
				content: 'Hello world',
			} );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		// The new edit must NOT update the resolved note 42 — it must spawn
		// a fresh note that coexists with the resolved one.
		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect( createSuggestion ).toHaveBeenCalledTimes( 2 );
		expect( createSuggestion ).toHaveBeenLastCalledWith(
			expect.objectContaining( {
				clientId: 'a',
				operations: expect.arrayContaining( [
					expect.objectContaining( {
						attribute: 'content',
						after: 'Hello world',
					} ),
				] ),
			} )
		);
	} );

	it( 'continues to update the linked note while it is still pending', async () => {
		createSuggestion.mockResolvedValue( { id: 42 } );
		updateSuggestion.mockResolvedValue( { id: 42 } );

		const { registry } = renderInSuggestMode(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		// Note exists in the cache but is still pending — same as the
		// real-world case where the comments query has run but no one has
		// resolved the note yet.
		seedComment( registry, { id: 42, status: 'hold' } );

		act( () => {
			overlayHandle.setOverlayAttributes( 'a', {
				content: 'Hello world',
			} );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 1500 );
		} );
		await flushPromises();
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledWith(
			expect.objectContaining( { commentId: 42 } )
		);
	} );

	it( 'does nothing when the editor is not in Suggest intent', async () => {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditorIntent( 'edit' );

		const wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					{ children }
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		render(
			<>
				<CaptureOverlay />
				<SuggestionAutoSave />
			</>,
			{ wrapper }
		);

		act( () => {
			overlayHandle.captureBaseline( 'a', 'core/paragraph', {
				content: 'Hi',
			} );
			overlayHandle.setOverlayAttributes( 'a', { content: 'Hello' } );
		} );

		await act( async () => {
			jest.advanceTimersByTime( 5000 );
		} );
		await flushPromises();

		expect( createSuggestion ).not.toHaveBeenCalled();
	} );
} );

describe( 'operationsForEntry', () => {
	it( 'derives attribute-set ops from baseline + overlay when no structural op is set', () => {
		expect(
			operationsForEntry( {
				blockName: 'core/paragraph',
				baselineAttributes: { content: 'a' },
				overlayAttributes: { content: 'b' },
			} )
		).toEqual( [
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'a',
				after: 'b',
			},
		] );
	} );

	it( 'returns the structural op as a single-element array when present', () => {
		const op = {
			type: 'block-remove',
			clientId: 'x',
			blockName: 'core/paragraph',
		};
		expect(
			operationsForEntry( {
				blockName: 'core/paragraph',
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: op,
			} )
		).toEqual( [ op ] );
	} );

	it( 'emits structural op first then attribute-set ops when both are present', () => {
		const op = { type: 'block-remove', clientId: 'x' };
		expect(
			operationsForEntry( {
				blockName: 'core/paragraph',
				baselineAttributes: { content: 'a' },
				overlayAttributes: { content: 'b' },
				structuralOp: op,
			} )
		).toEqual( [
			op,
			{
				type: 'attribute-set',
				attribute: 'content',
				before: 'a',
				after: 'b',
			},
		] );
	} );
} );
