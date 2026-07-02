/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { useEffect } from '@wordpress/element';
import { createRegistry, RegistryProvider, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	RichTextData,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import SuggestionContentReconciler, {
	contentKey,
} from '../suggestion-content-reconciler';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
} from '../../inline-suggestions';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// jest.mock factories may only reference variables prefixed with `mock`.
const mockCreateSuggestion = jest.fn();
const mockDeleteSuggestion = jest.fn();

jest.mock( '../provider', () => {
	const actual = jest.requireActual( '../provider' );
	return {
		...actual,
		useSuggestionsProvider: () => ( {
			createSuggestion: mockCreateSuggestion,
			deleteSuggestion: mockDeleteSuggestion,
		} ),
	};
} );

const createSuggestion = mockCreateSuggestion;
const deleteSuggestion = mockDeleteSuggestion;

const TEST_BLOCK_NAME = 'core/test-content-reconciler';

beforeAll( () => {
	registerSuggestionFormat();
	registerBlockType( TEST_BLOCK_NAME, {
		apiVersion: 3,
		title: 'Test block',
		category: 'text',
		attributes: {
			content: { type: 'string' },
			metadata: { type: 'object' },
		},
		save: () => null,
	} );
} );

afterAll( () => {
	if ( select( richTextStore ).getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		unregisterFormatType( SUGGESTION_FORMAT_NAME );
	}
} );

beforeEach( () => {
	createSuggestion.mockReset();
	deleteSuggestion.mockReset();
	deleteSuggestion.mockResolvedValue( undefined );
} );

// Test harness exposes the overlay API via a render-prop ref so tests can
// call `requestContentSuggestion` the way the per-block HOC does.
const overlayRef = { current: null };
function CaptureOverlay() {
	const overlay = useSuggestionOverlay();
	useEffect( () => {
		overlayRef.current = overlay;
	}, [ overlay ] );
	return null;
}

function setup( { content = 'Hello' } = {} ) {
	const registry = createRegistry();
	registry.register( noticesStore );
	registry.register( coreStore );
	registry.register( preferencesStore );
	registry.register( blockEditorStore );
	registry.register( editorStore );
	unlock( registry.dispatch( editorStore ) ).setEditorIntent( 'suggest' );

	const block = createBlock( TEST_BLOCK_NAME, {} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry
		.dispatch( blockEditorStore )
		.updateBlockAttributes( block.clientId, {
			content: RichTextData.fromHTMLString( content ),
		} );

	const wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>{ children }</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	render(
		<>
			<CaptureOverlay />
			<SuggestionContentReconciler />
		</>,
		{ wrapper }
	);

	const getContent = () =>
		String(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId )?.content ?? ''
		);
	const getNotices = () => registry.select( noticesStore ).getNotices();

	return { registry, clientId: block.clientId, getContent, getNotices };
}

function deferred() {
	let resolve;
	let reject;
	const promise = new Promise( ( res, rej ) => {
		resolve = res;
		reject = rej;
	} );
	return { promise, resolve, reject };
}

async function flushPromises() {
	await act( async () => {
		for ( let i = 0; i < 10; i++ ) {
			await Promise.resolve();
		}
	} );
}

const insertPlan = ( at = 5, text = ' world' ) => ( {
	kind: 'edit',
	actions: [ { type: 'insert-add', text, at, newNote: true } ],
} );

describe( 'SuggestionContentReconciler', () => {
	it( 'writes the planned markers when the content is unchanged (happy path)', async () => {
		const { clientId, getContent } = setup();
		createSuggestion.mockResolvedValue( { id: 5 } );

		let accepted;
		act( () => {
			accepted = overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: insertPlan(),
			} );
		} );
		expect( accepted ).toBe( true );
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( getContent() ).toContain( 'data-suggestion-id="5"' );
		expect( getContent() ).toContain( ' world' );
	} );

	it( 'declines synchronously when the plan is not executable', () => {
		const { clientId } = setup();

		let accepted;
		act( () => {
			accepted = overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: {
					kind: 'edit',
					// `grow-add` reuses an existing note: not this handler's job.
					actions: [ { type: 'grow-add', text: 'x', id: '9' } ],
				},
			} );
		} );

		expect( accepted ).toBe( false );
		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'queues a second edit on the same block instead of dropping it', async () => {
		const { clientId, getNotices } = setup();
		const firstNote = deferred();
		createSuggestion.mockReturnValueOnce( firstNote.promise );
		createSuggestion.mockResolvedValue( { id: 6 } );

		let firstAccepted;
		let secondAccepted;
		act( () => {
			firstAccepted = overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: insertPlan( 5, ' world' ),
			} );
			secondAccepted = overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: insertPlan( 0, 'Oh, ' ),
			} );
		} );
		await flushPromises();

		// Both were accepted; the second waits for the first instead of
		// vanishing on an in-flight guard.
		expect( firstAccepted ).toBe( true );
		expect( secondAccepted ).toBe( true );
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			firstNote.resolve( { id: 5 } );
		} );
		await flushPromises();

		/*
		 * The first write landed markers, so the second task's snapshot is
		 * stale when its turn comes: it must abandon (with a notice) rather
		 * than clobber the first write, and must not have been silently
		 * dropped while the first was in flight.
		 */
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'abandons the write and trashes the note when content changes mid-flight', async () => {
		const { registry, clientId, getContent, getNotices } = setup();
		const note = deferred();
		createSuggestion.mockReturnValue( note.promise );

		act( () => {
			overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: insertPlan(),
			} );
		} );
		await flushPromises();

		// A collaborator (or the typing keyboard) writes while the note POST
		// is in flight.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					content: RichTextData.fromHTMLString( 'Hello, peer edit' ),
				} );
		} );

		await act( async () => {
			note.resolve( { id: 7 } );
		} );
		await flushPromises();

		// The stale plan is not written over the peer's content...
		expect( getContent() ).toBe( 'Hello, peer edit' );
		// ...the just-created note is trashed...
		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: 7 } );
		// ...and the user is told the edit wasn't captured.
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );

	it( 'trashes earlier notes when a later note of a replace plan fails to open', async () => {
		const { clientId, getContent, getNotices } = setup();
		createSuggestion
			.mockResolvedValueOnce( { id: 11 } )
			// Second note comes back without an id.
			.mockResolvedValueOnce( {} );

		act( () => {
			overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: {
					kind: 'edit',
					actions: [
						{ type: 'wrap-del', start: 0, end: 5, newNote: true },
						{
							type: 'insert-add',
							text: 'Howdy',
							at: 5,
							newNote: true,
						},
					],
				},
			} );
		} );
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 2 );
		// The half-created replace plan is rolled back, not orphaned.
		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: 11 } );
		expect( getContent() ).toBe( 'Hello' );
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );

	it( 'trashes created notes when a later note POST throws', async () => {
		const { clientId, getContent, getNotices } = setup();
		createSuggestion
			.mockResolvedValueOnce( { id: 21 } )
			.mockRejectedValueOnce( new Error( 'network down' ) );

		act( () => {
			overlayRef.current.requestContentSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello' ),
				plan: {
					kind: 'edit',
					actions: [
						{ type: 'wrap-del', start: 0, end: 5, newNote: true },
						{
							type: 'insert-add',
							text: 'Howdy',
							at: 5,
							newNote: true,
						},
					],
				},
			} );
		} );
		await flushPromises();

		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: 21 } );
		expect( getContent() ).toBe( 'Hello' );
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );
} );

describe( 'contentKey', () => {
	it( 'returns strings as-is and stringifies rich values', () => {
		expect( contentKey( 'abc' ) ).toBe( 'abc' );
		expect(
			contentKey( RichTextData.fromHTMLString( 'a <em>b</em>' ) )
		).toBe( 'a <em>b</em>' );
		expect( contentKey( undefined ) ).toBe( null );
		expect( contentKey( null ) ).toBe( null );
	} );
} );
