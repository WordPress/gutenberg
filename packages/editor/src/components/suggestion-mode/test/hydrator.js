/**
 * Tests for `hydrator.js`. The component watches the post's note threads
 * and seeds the suggestion overlay from each unresolved comment that
 * carries an `attribute-set` payload. Coverage focuses on the dispatch
 * decisions; the rendering of the marks themselves is exercised in
 * `test/with-suggestion-overlay.js`.
 *
 * `useNoteThreads` is mocked so we can drive the thread list directly
 * without standing up the entity-records query that the real hook uses.
 */

/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Internal dependencies
 */
import SuggestionOverlayHydrator from '../hydrator';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

jest.mock( '../../collab-sidebar/hooks', () => ( {
	useNoteThreads: jest.fn(),
} ) );

// eslint-disable-next-line import/order
const { useNoteThreads } = require( '../../collab-sidebar/hooks' );

function makePayload( operations, blockName = 'core/paragraph' ) {
	return JSON.stringify( {
		schemaVersion: 2,
		blockName,
		baseRevision: null,
		operations,
	} );
}

// Renders the hydrator inside a provider plus a probe that captures
// the live entries map so the test can assert against it.
function renderWithProbe( { intent = 'edit' } = {} ) {
	const registry = createRegistry();
	registry.register( editorStore );
	registry.dispatch( editorStore ).setEditedPost( 'post', 42 );
	registry.dispatch( editorStore ).setEditorIntent( intent );

	let latestEntries = null;
	function Probe() {
		const { entries } = useSuggestionOverlay();
		latestEntries = entries;
		return null;
	}

	const utils = render(
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>
				<SuggestionOverlayHydrator />
				<Probe />
			</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	return {
		...utils,
		registry,
		getEntries: () => latestEntries,
	};
}

describe( 'SuggestionOverlayHydrator', () => {
	beforeEach( () => {
		useNoteThreads.mockReset();
	} );

	it( 'seeds an entry from an unresolved attribute-set payload', () => {
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 101,
					blockClientId: 'block-a',
					status: 'hold',
					meta: {
						_wp_suggestion: makePayload( [
							{
								type: 'attribute-set',
								attribute: 'content',
								before: 'Hello',
								after: 'Hello world',
							},
						] ),
					},
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		const entries = getEntries();
		expect( entries[ 'block-a' ] ).toEqual( {
			blockName: 'core/paragraph',
			baselineAttributes: { content: 'Hello' },
			overlayAttributes: { content: 'Hello world' },
			commentId: 101,
			authorId: null,
			syncedOpsKey: null,
			hydratedFromCommentId: 101,
		} );
	} );

	it( "carries the note author's id onto the seeded entry", () => {
		// The author id lets the overlay tint inline marks with the
		// suggester's color instead of the current viewer's.
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 107,
					blockClientId: 'block-a',
					status: 'hold',
					author: 55,
					meta: {
						_wp_suggestion: makePayload( [
							{
								type: 'attribute-set',
								attribute: 'content',
								before: 'Hello',
								after: 'Hello world',
							},
						] ),
					},
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		expect( getEntries()[ 'block-a' ].authorId ).toBe( 55 );
	} );

	it( 'aggregates multiple attribute-set ops on the same block', () => {
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 102,
					blockClientId: 'block-a',
					status: 'hold',
					meta: {
						_wp_suggestion: makePayload(
							[
								{
									type: 'attribute-set',
									attribute: 'content',
									before: 'before',
									after: 'after',
								},
								{
									type: 'attribute-set',
									attribute: 'level',
									before: 2,
									after: 3,
								},
							],
							'core/heading'
						),
					},
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		expect( getEntries()[ 'block-a' ] ).toMatchObject( {
			blockName: 'core/heading',
			baselineAttributes: { content: 'before', level: 2 },
			overlayAttributes: { content: 'after', level: 3 },
		} );
	} );

	it( 'skips threads with no resolvable blockClientId', () => {
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 103,
					blockClientId: null,
					status: 'hold',
					meta: {
						_wp_suggestion: makePayload( [
							{
								type: 'attribute-set',
								attribute: 'content',
								before: 'a',
								after: 'b',
							},
						] ),
					},
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		expect( getEntries() ).toEqual( {} );
	} );

	it( 'skips threads whose payload fails to parse', () => {
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 104,
					blockClientId: 'block-a',
					status: 'hold',
					meta: { _wp_suggestion: 'not json' },
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		expect( getEntries() ).toEqual( {} );
	} );

	it( 'skips structural-only payloads — those are rendered via metadata.suggestion on the block, not via the overlay', () => {
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 105,
					blockClientId: 'block-a',
					status: 'hold',
					meta: {
						_wp_suggestion: makePayload( [
							{
								type: 'block-remove',
								clientId: 'block-a',
								blockName: 'core/paragraph',
							},
						] ),
					},
				},
			],
		} );

		const { getEntries } = renderWithProbe();
		expect( getEntries() ).toEqual( {} );
	} );

	it( 'does not clobber a live overlay write that was not hydrator-sourced', () => {
		// The hydrator must refuse to overwrite an entry that was put in
		// place by a live edit, because the suggester may be mid-edit and
		// their unsaved overlay is more current than the persisted comment.
		// Test in two steps so the live state is settled in the reducer
		// before the hydrator mounts and reads `entries` from its render
		// closure — otherwise the unit-test render would batch both
		// dispatches into the same commit and the hydrator's first effect
		// would see an empty entries map.
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [
				{
					id: 106,
					blockClientId: 'block-a',
					status: 'hold',
					meta: {
						_wp_suggestion: makePayload( [
							{
								type: 'attribute-set',
								attribute: 'content',
								before: 'persisted before',
								after: 'persisted after',
							},
						] ),
					},
				},
			],
		} );

		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditedPost( 'post', 42 );

		let overlayApi = null;
		let entries = null;
		function Probe() {
			overlayApi = useSuggestionOverlay();
			entries = overlayApi.entries;
			return null;
		}

		// Step 1: mount only the provider + probe. Capture the overlay API
		// so we can dispatch a live write directly.
		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					<Probe />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		act( () => {
			overlayApi.captureBaseline( 'block-a', 'core/paragraph', {
				content: 'live baseline',
			} );
			overlayApi.setOverlayAttributes( 'block-a', {
				content: 'live in-progress',
			} );
		} );

		// Step 2: re-render with the hydrator mounted. Its first effect
		// will see the live entry and skip the seed.
		rerender(
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					<Probe />
					<SuggestionOverlayHydrator />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		// Live overlay wins; no hydratedFromCommentId stamp.
		expect( entries[ 'block-a' ].overlayAttributes ).toEqual( {
			content: 'live in-progress',
		} );
		expect( entries[ 'block-a' ].hydratedFromCommentId ).toBeUndefined();
	} );

	it( 'is a no-op when there are no unresolved threads', () => {
		// The empty-list branch must not dispatch — orphan-prune / re-render
		// cycles would otherwise churn the reducer unnecessarily.
		useNoteThreads.mockReturnValue( { notes: [], unresolvedNotes: [] } );
		const { getEntries } = renderWithProbe();
		expect( getEntries() ).toEqual( {} );
	} );

	it( 'clears a hydrated entry once its note leaves the unresolved set', () => {
		// Models a suggestion accepted or rejected in another tab: the note
		// flips out of `hold`, so `unresolvedNotes` no longer includes it and
		// the hydrated inline marks must be cleared even though the block
		// still exists.
		const thread = {
			id: 108,
			blockClientId: 'block-a',
			status: 'hold',
			meta: {
				_wp_suggestion: makePayload( [
					{
						type: 'attribute-set',
						attribute: 'content',
						before: 'Hello',
						after: 'Hello world',
					},
				] ),
			},
		};
		useNoteThreads.mockReturnValue( {
			notes: [],
			unresolvedNotes: [ thread ],
		} );

		const registry = createRegistry();
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditedPost( 'post', 42 );

		let entries = null;
		function Probe() {
			entries = useSuggestionOverlay().entries;
			return null;
		}

		// A fresh element each render — passing the identical element
		// reference makes React bail out of reconciling the subtree, so the
		// hydrator would never see the updated mock.
		const tree = () => (
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					<Probe />
					<SuggestionOverlayHydrator />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		const { rerender } = render( tree() );
		expect( entries[ 'block-a' ] ).toBeDefined();

		// The note is resolved elsewhere: it drops out of the unresolved set.
		// `rerender` is already wrapped in `act` by Testing Library.
		useNoteThreads.mockReturnValue( { notes: [], unresolvedNotes: [] } );
		rerender( tree() );

		expect( entries[ 'block-a' ] ).toBeUndefined();
	} );

	it( 'leaves a live, non-hydrated overlay in place when the note set is empty', () => {
		// The cleanup path must only prune hydrator-sourced entries. A purely
		// local in-progress suggestion (no `hydratedFromCommentId`) is not
		// backed by a note and must survive an empty unresolved set.
		useNoteThreads.mockReturnValue( { notes: [], unresolvedNotes: [] } );

		const registry = createRegistry();
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditedPost( 'post', 42 );

		let overlayApi = null;
		let entries = null;
		function Probe() {
			overlayApi = useSuggestionOverlay();
			entries = overlayApi.entries;
			return null;
		}

		const { rerender } = render(
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					<Probe />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		act( () => {
			overlayApi.captureBaseline( 'block-a', 'core/paragraph', {
				content: 'live baseline',
			} );
			overlayApi.setOverlayAttributes( 'block-a', {
				content: 'live in-progress',
			} );
		} );

		rerender(
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					<Probe />
					<SuggestionOverlayHydrator />
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		expect( entries[ 'block-a' ] ).toBeDefined();
		expect( entries[ 'block-a' ].overlayAttributes ).toEqual( {
			content: 'live in-progress',
		} );
	} );
} );
