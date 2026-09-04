import {
	afterAll,
	beforeAll,
	beforeEach,
	describe,
	expect,
	it,
	vi,
} from 'vitest';
import { render, act } from '@testing-library/react';
import { useEffect } from '@wordpress/element';
import { createRegistry, RegistryProvider, select } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { store as noticesStore } from '@wordpress/notices';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as preferencesStore } from '@wordpress/preferences';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import {
	RichTextData,
	registerFormatType,
	unregisterFormatType,
	store as richTextStore,
} from '@wordpress/rich-text';
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

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

// The mock factory is hoisted above the imports, so the functions it hands
// out have to be created there too.
const { createSuggestion, updateSuggestion, deleteSuggestion } = vi.hoisted(
	() => ( {
		createSuggestion: vi.fn(),
		updateSuggestion: vi.fn(),
		deleteSuggestion: vi.fn(),
	} )
);

vi.mock( import( '../provider' ), async ( importOriginal ) => {
	const actual = await importOriginal();
	return {
		...actual,
		useSuggestionsProvider: () =>
			( {
				createSuggestion,
				updateSuggestion,
				deleteSuggestion,
			} ) as unknown as ReturnType<
				typeof actual.useSuggestionsProvider
			>,
	};
} );

const AUTHOR_ID = 7;
const POST_ID = 5;

const TEST_BLOCK_NAME = 'core/test-format-keyboard';

const getFormatType = ( name: string ) =>
	( select( richTextStore as any ) as any ).getFormatType( name );

beforeAll( () => {
	registerSuggestionFormat();
	if ( ! getFormatType( 'test/bold' ) ) {
		registerFormatType( 'test/bold', {
			title: 'Bold',
			tagName: 'strong',
			className: null,
			edit: () => null,
		} as any );
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
	updateSuggestion.mockReset();
	updateSuggestion.mockResolvedValue( { id: 9 } );
	deleteSuggestion.mockReset();
	deleteSuggestion.mockResolvedValue( undefined );
} );

// Test harness exposes the overlay API via a render-prop ref so tests can
// call `requestFormatSuggestion` the way the per-block HOC does.
const overlayRef: { current: any } = { current: null };
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

	registry.dispatch( coreStore ).receiveCurrentUser( { id: AUTHOR_ID } );
	registry.dispatch( editorStore ).setEditedPost( 'post', POST_ID as any );

	const block = createBlock( TEST_BLOCK_NAME, {} );
	registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );
	registry
		.dispatch( blockEditorStore )
		.updateBlockAttributes( block.clientId, {
			content: RichTextData.fromHTMLString( content ),
		} );

	const wrapper = ( { children }: { children?: React.ReactNode } ) => (
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
	const getMetadata = () =>
		registry.select( blockEditorStore ).getBlockAttributes( block.clientId )
			?.metadata;

	return {
		registry,
		clientId: block.clientId,
		getContent,
		getNotices,
		getMetadata,
	};
}

// The note record behind a pending `format` suggestion, as the sidebar's
// thread query leaves it in the entity store.
function formatNote( { id = 9, beforeHTML = 'world' } = {} ) {
	return {
		id,
		parent: 0,
		status: 'hold',
		meta: {
			_wp_suggestion: JSON.stringify( {
				schemaVersion: 2,
				operations: [
					{
						type: 'inline-suggestion',
						attribute: 'content',
						suggestionType: 'format',
						beforeHTML,
						afterHTML: `<strong>${ beforeHTML }</strong>`,
					},
				],
			} ),
		},
	};
}

/*
 * Seed the note (and any replies) exactly as loading the post does: the record
 * arrives with the thread list, so `getEntityRecord` finds it in the store
 * while its own resolution was never run.
 */
function seedThreads( registry: any, records: any[] ) {
	registry
		.dispatch( coreStore )
		.receiveEntityRecords( 'root', 'comment', records, {
			post: POST_ID,
			type: 'note',
			status: 'all',
			per_page: -1,
		} );
}

function deferred() {
	let resolve: any;
	let reject: any;
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

	/*
	 * Drive the create path once so the block carries a real `format` marker
	 * stamped with this author — the state every second toggle starts from.
	 */
	async function makeFirstSuggestion( {
		registry,
		clientId,
		getContent,
	}: {
		registry: any;
		clientId: string;
		getContent: () => string;
	} ) {
		createSuggestion.mockResolvedValue( { id: 9 } );
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
		// The real provider writes this linkage; the mocked one does not.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					metadata: { noteId: [ 9 ] },
				} );
		} );
		return getContent();
	}

	// A second toggle over the marked run, as the HOC hands it to the handler.
	function secondToggle( markedHTML: string, nextHTML: string ) {
		const prevContent = RichTextData.fromHTMLString( markedHTML );
		const nextContent = RichTextData.fromHTMLString( nextHTML );
		return {
			prevContent,
			nextContent,
			plan: planFormatMarkers( prevContent, nextContent, {
				authorId: AUTHOR_ID,
			} ),
		};
	}

	const unbolded = ( markedHTML: string ) =>
		markedHTML.replace( /<\/?strong>/g, '' );
	const italicized = ( markedHTML: string ) =>
		markedHTML
			.replace( '<strong>', '<strong><em>' )
			.replace( '</strong>', '</em></strong>' );

	function request(
		clientId: string,
		{
			prevContent,
			nextContent,
			plan,
		}: { prevContent: any; nextContent: any; plan: any }
	) {
		act( () => {
			overlayRef.current.requestFormatSuggestion( {
				clientId,
				blockName: TEST_BLOCK_NAME,
				prevContent,
				nextContent,
				plan,
			} );
		} );
		return flushPromises();
	}

	it( 'revises the existing note from the record the post already loaded', async () => {
		const harness = setup();
		const { registry, clientId, getNotices } = harness;
		const marked = await makeFirstSuggestion( harness );
		// Seeded by the thread query only: the note's own resolution never ran,
		// so revising must not depend on resolving (or refetching) it.
		seedThreads( registry, [ formatNote() ] );

		await request( clientId, secondToggle( marked, italicized( marked ) ) );

		expect( createSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion ).toHaveBeenCalledTimes( 1 );
		expect( updateSuggestion.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			commentId: '9',
			operations: [
				expect.objectContaining( {
					beforeHTML: 'world',
					afterHTML: '<strong><em>world</em></strong>',
				} ),
			],
		} );
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( false );
	} );

	it( 'retracts the suggestion when the toggle restores the original run', async () => {
		const harness = setup();
		const { registry, clientId, getContent, getMetadata } = harness;
		const marked = await makeFirstSuggestion( harness );
		seedThreads( registry, [ formatNote() ] );

		await request( clientId, secondToggle( marked, unbolded( marked ) ) );

		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: '9' } );
		expect( getContent() ).toBe( 'Hello world' );
		// The linkage goes with the note, leaving no empty `metadata` object
		// behind to serialize.
		expect( getMetadata() ).toBeUndefined();
		// ...and it is bookkeeping, so it takes no undo level of its own: the
		// first Ctrl+Z has to undo the formatting, not restore a noteId
		// pointing at the note just trashed.
		expect(
			registry.select( blockEditorStore ).isLastBlockChangePersistent()
		).toBe( false );
	} );

	it( 'keeps a note that has replies instead of trashing the discussion', async () => {
		const harness = setup();
		const { registry, clientId, getContent, getNotices } = harness;
		const marked = await makeFirstSuggestion( harness );
		seedThreads( registry, [
			formatNote(),
			{ id: 10, parent: 9, status: 'hold' },
		] );

		await request( clientId, secondToggle( marked, unbolded( marked ) ) );

		expect( deleteSuggestion ).not.toHaveBeenCalled();
		// The marker stays, so the reply keeps its anchor...
		expect( getContent() ).toContain( 'data-suggestion-id="9"' );
		// ...the suggestion is revised to propose nothing...
		expect( updateSuggestion.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			operations: [
				expect.objectContaining( {
					beforeHTML: 'world',
					afterHTML: 'world',
				} ),
			],
		} );
		// ...and the user is told why the note is still there.
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'has replies' )
			)
		).toBe( true );
	} );

	it( 'keeps the note when the thread list has not resolved yet', async () => {
		const harness = setup();
		const { registry, clientId, getContent } = harness;
		const marked = await makeFirstSuggestion( harness );
		/*
		 * The note itself is in the store, but the THREAD LIST that carries its
		 * replies has not resolved - the state right after a load, or after that
		 * fetch failed. Reading an unresolved list as "no replies" would trash a
		 * discussion nobody has seen yet, which cannot be undone, so an unknown
		 * list has to fail closed.
		 */
		registry
			.dispatch( coreStore )
			.receiveEntityRecords( 'root', 'comment', [ formatNote() ] );

		await request( clientId, secondToggle( marked, unbolded( marked ) ) );

		expect( deleteSuggestion ).not.toHaveBeenCalled();
		expect( getContent() ).toContain( 'data-suggestion-id="9"' );
	} );

	it( 'declines to revise when the run no longer matches the recorded original', async () => {
		const harness = setup();
		const { registry, clientId, getNotices } = harness;
		const marked = await makeFirstSuggestion( harness );
		// The note recorded a shorter run than the marker now spans. A reject
		// replaces the whole span with that original, so revising would set up
		// a reject that deletes the difference.
		seedThreads( registry, [ formatNote( { beforeHTML: 'wor' } ) ] );

		await request( clientId, secondToggle( marked, italicized( marked ) ) );

		expect( updateSuggestion ).not.toHaveBeenCalled();
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( true );
	} );

	it( 'retracts a block whose content is a plain string', async () => {
		const harness = setup();
		const { registry, clientId, getContent, getNotices } = harness;
		const marked = String( await makeFirstSuggestion( harness ) );
		seedThreads( registry, [ formatNote() ] );

		// Some blocks hand `setAttributes` a plain string rather than a
		// RichTextData; the restore has to work the same way.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { content: marked } );
		} );
		const prevContent = marked;
		const nextContent = unbolded( marked );
		await request( clientId, {
			prevContent,
			nextContent,
			plan: planFormatMarkers( prevContent, nextContent, {
				authorId: AUTHOR_ID,
			} ),
		} );

		expect( deleteSuggestion ).toHaveBeenCalledWith( { commentId: '9' } );
		expect( getContent() ).toBe( 'Hello world' );
		expect(
			getNotices().some( ( notice ) =>
				notice.content.includes( 'could not be captured' )
			)
		).toBe( false );
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
