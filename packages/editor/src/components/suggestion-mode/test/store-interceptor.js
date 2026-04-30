/**
 * External dependencies
 */
import { render, act } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SuggestionStoreInterceptor, {
	diffAttributes,
	shallowAttributeEquals,
	adoptSystemMetadata,
	stripSystemMetadata,
} from '../store-interceptor';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

describe( 'shallowAttributeEquals', () => {
	it( 'treats reference-equal values as equal', () => {
		const obj = { a: 1 };
		expect( shallowAttributeEquals( obj, obj ) ).toBe( true );
	} );

	it( 'returns true for primitives that match', () => {
		expect( shallowAttributeEquals( 1, 1 ) ).toBe( true );
		expect( shallowAttributeEquals( 'a', 'a' ) ).toBe( true );
	} );

	it( 'returns false when only one side is null/undefined', () => {
		expect( shallowAttributeEquals( null, {} ) ).toBe( false );
		expect( shallowAttributeEquals( undefined, '' ) ).toBe( false );
	} );

	it( 'compares plain objects by structure', () => {
		expect( shallowAttributeEquals( { a: 1, b: 2 }, { a: 1, b: 2 } ) ).toBe(
			true
		);
	} );
} );

describe( 'diffAttributes', () => {
	it( 'returns null when attributes are unchanged', () => {
		expect(
			diffAttributes( { content: 'a' }, { content: 'a' } )
		).toBeNull();
	} );

	it( 'detects changed values and emits matching restore', () => {
		expect( diffAttributes( { level: 2 }, { level: 3 } ) ).toEqual( {
			changed: { level: 3 },
			restore: { level: 2 },
		} );
	} );

	it( 'detects added keys (no previous value to restore)', () => {
		expect( diffAttributes( {}, { url: 'https://example.test' } ) ).toEqual(
			{
				changed: { url: 'https://example.test' },
				restore: { url: undefined },
			}
		);
	} );

	it( 'detects removed keys and includes them in restore', () => {
		expect( diffAttributes( { align: 'center' }, {} ) ).toEqual( {
			changed: { align: undefined },
			restore: { align: 'center' },
		} );
	} );

	it( 'collects multiple changes in one delta', () => {
		const delta = diffAttributes(
			{ level: 2, content: 'Hi' },
			{ level: 3, content: 'Hi' }
		);
		expect( delta ).toEqual( {
			changed: { level: 3 },
			restore: { level: 2 },
		} );
	} );
} );

describe( 'adoptSystemMetadata', () => {
	it( 'returns the same reference when no system metadata key changed', () => {
		const previous = { content: 'Hi', metadata: { name: 'Greeting' } };
		const current = { content: 'Hi', metadata: { name: 'Greeting' } };
		expect( adoptSystemMetadata( previous, current ) ).toBe( previous );
	} );

	it( 'folds a newly-added noteId into the snapshot', () => {
		const previous = { content: 'Hi', metadata: {} };
		const current = { content: 'Hi', metadata: { noteId: 42 } };
		const adopted = adoptSystemMetadata( previous, current );
		expect( adopted ).not.toBe( previous );
		expect( adopted ).toEqual( {
			content: 'Hi',
			metadata: { noteId: 42 },
		} );
	} );

	it( 'folds a changed noteId into the snapshot', () => {
		const previous = { metadata: { noteId: 1 } };
		const current = { metadata: { noteId: 2 } };
		expect( adoptSystemMetadata( previous, current ) ).toEqual( {
			metadata: { noteId: 2 },
		} );
	} );

	it( 'removes noteId when current no longer has one', () => {
		const previous = { metadata: { noteId: 7, name: 'Keep' } };
		const current = { metadata: { name: 'Keep' } };
		expect( adoptSystemMetadata( previous, current ) ).toEqual( {
			metadata: { name: 'Keep' },
		} );
	} );

	it( 'preserves user-managed metadata keys when adopting noteId', () => {
		const previous = { metadata: { name: 'Greeting' } };
		const current = { metadata: { name: 'Greeting', noteId: 9 } };
		expect( adoptSystemMetadata( previous, current ) ).toEqual( {
			metadata: { name: 'Greeting', noteId: 9 },
		} );
	} );

	it( 'never folds non-system metadata keys', () => {
		const previous = { metadata: { bindings: { a: 1 } } };
		const current = { metadata: { bindings: { b: 2 } } };
		// `bindings` is a user-managed key — should be left alone for the
		// regular diff to handle.
		expect( adoptSystemMetadata( previous, current ) ).toBe( previous );
	} );
} );

describe( 'SuggestionStoreInterceptor (integration)', () => {
	const TEST_BLOCK_NAME = 'core/test-suggestion-block';

	beforeAll( () => {
		registerBlockType( TEST_BLOCK_NAME, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Suggestion Block',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	function setup() {
		const registry = createRegistry();
		registry.register( noticesStore );
		// `preferencesStore` is required by `setEditorIntent` on branches
		// where the intent is persisted as a preference; later branches
		// switched to in-memory session state and ignore it. Registering
		// it here keeps the test portable across the stacked PR set.
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditorIntent( 'suggest' );

		const block = createBlock( TEST_BLOCK_NAME, { content: 'Hello' } );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		let overlayHandle;
		function CaptureOverlay() {
			overlayHandle = useSuggestionOverlay();
			return null;
		}

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
				<SuggestionStoreInterceptor />
			</>,
			{ wrapper }
		);

		return {
			registry,
			clientId: block.clientId,
			getOverlay: () => overlayHandle,
		};
	}

	async function flushSubscribers() {
		// `registry.subscribe` callbacks are scheduled asynchronously after
		// dispatches; one microtask flush is enough for the interceptor's
		// post-dispatch reaction to run.
		await act( async () => {
			await Promise.resolve();
		} );
	}

	it( 'preserves a programmatic metadata.noteId update on the live block', async () => {
		// This is the regression scenario from the suggestion provider:
		// after creating a note comment it calls
		// `updateBlockAttributes(clientId, { metadata: { noteId } })` to
		// link the block to its note. Without the fix, the interceptor
		// reverted that update and the note appeared orphaned in the sidebar.
		const { registry, clientId, getOverlay } = setup();

		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					metadata: { noteId: 42 },
				} );
		} );
		await flushSubscribers();

		const liveAttributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );

		expect( liveAttributes?.metadata?.noteId ).toBe( 42 );
		// The system update must NOT leak into the overlay.
		expect(
			getOverlay().entries[ clientId ]?.overlayAttributes?.metadata
		).toBeUndefined();
	} );

	it( 'preserves metadata.noteId while still intercepting other attribute changes', async () => {
		const { registry, clientId, getOverlay } = setup();

		// First, link the block to a note (as the suggestion provider would).
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { metadata: { noteId: 7 } } );
		} );
		await flushSubscribers();

		// Then simulate a direct user-driven mutation of `content` (the kind
		// of bypass the interceptor was added for, e.g. a block-switcher
		// variation picker calling `updateBlockAttributes` directly).
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { content: 'Edited' } );
		} );
		await flushSubscribers();

		const liveAttributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );

		// noteId is preserved on the live block (system linkage).
		expect( liveAttributes?.metadata?.noteId ).toBe( 7 );
		// The user content edit is reverted to the baseline.
		expect( liveAttributes?.content ).toBe( 'Hello' );
		// The user content edit IS captured in the overlay.
		expect(
			getOverlay().entries[ clientId ]?.overlayAttributes?.content
		).toBe( 'Edited' );
		// noteId never appears in the overlay.
		expect(
			getOverlay().entries[ clientId ]?.overlayAttributes?.metadata
		).toBeUndefined();
	} );

	it( 'preserves metadata.noteId when reverting a same-tick combined mutation', async () => {
		const { registry, clientId, getOverlay } = setup();

		// A direct dispatch that touches both `content` (user-style) and
		// `metadata.noteId` (system-style) at the same time. The interceptor
		// must keep the noteId on the live block while still routing the
		// content change into the overlay.
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					content: 'Edited',
					metadata: { noteId: 11 },
				} );
		} );
		await flushSubscribers();

		const liveAttributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );

		expect( liveAttributes?.metadata?.noteId ).toBe( 11 );
		expect( liveAttributes?.content ).toBe( 'Hello' );
		expect(
			getOverlay().entries[ clientId ]?.overlayAttributes?.content
		).toBe( 'Edited' );
	} );

	it( 'lands an apply-style mutation on the live block when bypass is requested', async () => {
		// The accept/reject suggestion flow calls `updateBlockAttributes`
		// directly on the block-editor store. Without an explicit bypass
		// the interceptor would mistake the apply for a user edit and
		// revert it — so "Accept suggestion" would silently no-op while
		// in Suggest mode. The provider opts into a bypass for the apply
		// dispatch and clears the overlay so the new attributes become
		// the new baseline.
		const { registry, clientId, getOverlay } = setup();

		// User had a pending suggestion overlay on this block.
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { content: 'Suggested' } );
		} );
		await flushSubscribers();

		// Sanity: the user-style edit was reverted into the overlay.
		expect(
			registry.select( blockEditorStore ).getBlockAttributes( clientId )
				?.content
		).toBe( 'Hello' );

		// Now run the apply path the way the provider will: ask the
		// interceptor to bypass the next dispatch, drop the overlay, and
		// write the applied attributes.
		await act( async () => {
			getOverlay().requestInterceptorBypass( clientId );
			getOverlay().clearOverlay( clientId );
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { content: 'Applied' } );
		} );
		await flushSubscribers();

		const liveAttributes = registry
			.select( blockEditorStore )
			.getBlockAttributes( clientId );

		// The applied attributes land on the live block — they aren't
		// reverted to baseline.
		expect( liveAttributes?.content ).toBe( 'Applied' );
		// The overlay entry is gone, so future edits start from a fresh
		// baseline that reflects the applied state.
		expect( getOverlay().entries[ clientId ] ).toBeUndefined();

		// A subsequent user-style edit is still intercepted normally and
		// rebaselines against the post-apply attributes.
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, { content: 'After apply' } );
		} );
		await flushSubscribers();

		expect(
			registry.select( blockEditorStore ).getBlockAttributes( clientId )
				?.content
		).toBe( 'Applied' );
		expect(
			getOverlay().entries[ clientId ]?.overlayAttributes?.content
		).toBe( 'After apply' );
	} );
} );

describe( 'stripSystemMetadata', () => {
	it( 'returns the payload unchanged when there is no metadata', () => {
		const payload = { content: 'Hi' };
		expect( stripSystemMetadata( payload ) ).toBe( payload );
	} );

	it( 'returns the payload unchanged when metadata has no system keys', () => {
		const payload = { metadata: { name: 'Section' } };
		expect( stripSystemMetadata( payload ) ).toBe( payload );
	} );

	it( 'drops noteId from metadata while keeping other keys', () => {
		const payload = { metadata: { noteId: 5, name: 'Section' } };
		expect( stripSystemMetadata( payload ) ).toEqual( {
			metadata: { name: 'Section' },
		} );
	} );

	it( 'drops the metadata key entirely when only system keys remain', () => {
		const payload = { content: 'Hi', metadata: { noteId: 5 } };
		expect( stripSystemMetadata( payload ) ).toEqual( {
			content: 'Hi',
		} );
	} );

	it( 'preserves other top-level keys', () => {
		const payload = {
			content: 'Hi',
			level: 3,
			metadata: { noteId: 5, name: 'Heading' },
		};
		expect( stripSystemMetadata( payload ) ).toEqual( {
			content: 'Hi',
			level: 3,
			metadata: { name: 'Heading' },
		} );
	} );
} );
