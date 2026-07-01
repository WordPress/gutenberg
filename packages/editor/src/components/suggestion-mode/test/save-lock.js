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
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
	getBlockTypes,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import SuggestionSaveLock from '../save-lock';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

const TEST_BLOCK_NAME = 'core/test-save-lock-block';

describe( 'SuggestionSaveLock', () => {
	beforeAll( () => {
		registerBlockType( TEST_BLOCK_NAME, {
			apiVersion: 3,
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save: () => null,
			category: 'text',
			title: 'Test Save Lock Block',
		} );
	} );

	afterAll( () => {
		getBlockTypes().forEach( ( block ) =>
			unregisterBlockType( block.name )
		);
	} );

	let overlayHandle;
	function CaptureOverlay() {
		overlayHandle = useSuggestionOverlay();
		return null;
	}

	function setup( { initialBlocks } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );

		const blocks = initialBlocks ?? [
			createBlock( TEST_BLOCK_NAME, { content: 'Hello' } ),
		];
		registry.dispatch( blockEditorStore ).resetBlocks( blocks );

		const wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					{ children }
				</SuggestionOverlayProvider>
			</RegistryProvider>
		);

		const utils = render(
			<>
				<CaptureOverlay />
				<SuggestionSaveLock />
			</>,
			{ wrapper }
		);

		return {
			registry,
			clientId: blocks[ 0 ].clientId,
			getOverlay: () => overlayHandle,
			...utils,
		};
	}

	it( 'does not lock saving when nothing is pending', () => {
		const { registry } = setup();
		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			false
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			false
		);
	} );

	it( 'locks saving and autosaving while a block carries a structural marker, and unlocks when it clears', async () => {
		const { registry, clientId } = setup();

		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					metadata: { suggestion: { type: 'pending-remove' } },
				} );
		} );

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			true
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			true
		);

		// Clearing the marker (as apply/reject do) releases both locks.
		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					metadata: {},
				} );
		} );

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			false
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			false
		);
	} );

	it( 'locks saving while an overlay entry holds a structural op', async () => {
		const { registry, clientId, getOverlay } = setup();

		await act( async () => {
			getOverlay().setStructuralOp( clientId, TEST_BLOCK_NAME, {
				type: 'block-remove',
				clientId,
				blockName: TEST_BLOCK_NAME,
			} );
		} );

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			true
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			true
		);

		await act( async () => {
			getOverlay().clearOverlay( clientId );
		} );

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			false
		);
	} );

	it( 'does not lock for attribute-only overlay entries', async () => {
		const { registry, clientId, getOverlay } = setup();

		await act( async () => {
			getOverlay().captureBaseline( clientId, TEST_BLOCK_NAME, {
				content: 'Hello',
			} );
			getOverlay().setOverlayAttributes( clientId, {
				content: 'Edited',
			} );
		} );

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			false
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			false
		);
	} );

	it( 'releases the locks on unmount', async () => {
		const { registry, clientId, unmount } = setup();

		await act( async () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( clientId, {
					metadata: { suggestion: { type: 'pending-insert' } },
				} );
		} );
		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			true
		);

		unmount();

		expect( registry.select( editorStore ).isPostSavingLocked() ).toBe(
			false
		);
		expect( registry.select( editorStore ).isPostAutosavingLocked() ).toBe(
			false
		);
	} );
} );
