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
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';

/**
 * Internal dependencies
 */
import SuggestionFormatKeyboard from '../suggestion-format-keyboard';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
	planFormatMarkers,
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

const TEST_BLOCK_NAME = 'core/test-format-keyboard';

const getFormatType = ( name ) => select( richTextStore ).getFormatType( name );

beforeAll( () => {
	registerSuggestionFormat();
	if ( ! getFormatType( 'test/bold' ) ) {
		registerFormatType( 'test/bold', {
			title: 'Bold',
			tagName: 'strong',
			className: null,
			edit: () => null,
		} );
	}
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
	if ( getFormatType( 'test/bold' ) ) {
		unregisterFormatType( 'test/bold' );
	}
	if ( getFormatType( SUGGESTION_FORMAT_NAME ) ) {
		unregisterFormatType( SUGGESTION_FORMAT_NAME );
	}
} );

beforeEach( () => {
	createSuggestion.mockReset();
	deleteSuggestion.mockReset();
	deleteSuggestion.mockResolvedValue( undefined );
} );

// Test harness exposes the overlay API via a render-prop ref so tests can
// call `requestFormatSuggestion` the way the per-block HOC does.
const overlayRef = { current: null };
function CaptureOverlay() {
	const overlay = useSuggestionOverlay();
	useEffect( () => {
		overlayRef.current = overlay;
	}, [ overlay ] );
	return null;
}

function setup( { content = 'Hello world' } = {} ) {
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
			<SuggestionFormatKeyboard />
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

// A real bold-toggle plan over "world" in "Hello world".
function boldPlan() {
	const prevContent = RichTextData.fromHTMLString( 'Hello world' );
	const nextContent = RichTextData.fromHTMLString(
		'Hello <strong>world</strong>'
	);
	return {
		prevContent,
		nextContent,
		plan: planFormatMarkers( prevContent, nextContent ),
	};
}

describe( 'SuggestionFormatKeyboard', () => {
	it( 'writes a single format marker when the content is unchanged (happy path)', async () => {
		const { clientId, getContent } = setup();
		createSuggestion.mockResolvedValue( { id: 9 } );
		const { prevContent, nextContent, plan } = boldPlan();

		let accepted;
		act( () => {
			accepted = overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
		} );
		expect( accepted ).toBe( true );
		await flushPromises();

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( getContent() ).toContain( 'data-suggestion-id="9"' );
		expect( getContent() ).toContain( 'data-suggestion-type="format"' );
		// The proposed bold survives, wrapping the marked run.
		expect( getContent() ).toMatch(
			/<strong><mark [^>]*>world<\/mark><\/strong>/
		);
	} );

	it( 'declines synchronously when the plan is not a format plan', () => {
		const { clientId } = setup();

		let accepted;
		act( () => {
			accepted = overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent: RichTextData.fromHTMLString( 'Hello world' ),
				nextContent: RichTextData.fromHTMLString( 'Hello world!' ),
				plan: { kind: 'none' },
			} );
		} );

		expect( accepted ).toBe( false );
		expect( createSuggestion ).not.toHaveBeenCalled();
	} );

	it( 'abandons the write and trashes the note when content changes mid-flight', async () => {
		const { registry, clientId, getContent, getNotices } = setup();
		const note = deferred();
		createSuggestion.mockReturnValue( note.promise );
		const { prevContent, nextContent, plan } = boldPlan();

		act( () => {
			overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
		} );
		await flushPromises();

		// A collaborator (or the typing keyboard) writes while the note POST
		// is in flight.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					content: RichTextData.fromHTMLString( 'Peer edit' ),
				} );
		} );

		await act( async () => {
			note.resolve( { id: 12 } );
		} );
		await flushPromises();

		// The stale marked value is not written over the peer's content...
		expect( getContent() ).toBe( 'Peer edit' );
		// ...the just-created note is trashed...
		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: 12 } );
		// ...and the user is told the change wasn't captured.
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );

	it( 'queues a second toggle on the same block instead of dropping it', async () => {
		const { clientId, getNotices } = setup();
		const firstNote = deferred();
		createSuggestion.mockReturnValueOnce( firstNote.promise );
		const { prevContent, nextContent, plan } = boldPlan();

		let firstAccepted;
		let secondAccepted;
		act( () => {
			firstAccepted = overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
			secondAccepted = overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
		} );
		await flushPromises();

		// Both accepted; only the first opened a note so far.
		expect( firstAccepted ).toBe( true );
		expect( secondAccepted ).toBe( true );
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );

		await act( async () => {
			firstNote.resolve( { id: 31 } );
		} );
		await flushPromises();

		/*
		 * The first write landed its marker, so the second task's snapshot is
		 * stale at its turn: it abandons with a notice instead of clobbering
		 * the first write — but it was never silently dropped.
		 */
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'notifies without writing when the note comes back without an id', async () => {
		const { clientId, getContent, getNotices } = setup();
		createSuggestion.mockResolvedValue( {} );
		const { prevContent, nextContent, plan } = boldPlan();

		act( () => {
			overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
		} );
		await flushPromises();

		expect( getContent() ).toBe( 'Hello world' );
		expect( deleteSuggestion ).not.toHaveBeenCalled();
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );
} );
