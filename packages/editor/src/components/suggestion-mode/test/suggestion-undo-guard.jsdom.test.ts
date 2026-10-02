import { describe, expect, it, vi } from 'vitest';
import { act, render } from '@testing-library/react';
import {
	createReduxStore,
	createRegistry,
	RegistryProvider,
} from '@wordpress/data';
import { createElement } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
import { store as preferencesStore } from '@wordpress/preferences';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import SuggestionUndoGuard, {
	findNewestPendingSuggestion,
} from '../suggestion-undo-guard';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

describe( 'findNewestPendingSuggestion', () => {
	it( 'returns null when nothing is pending', () => {
		expect( findNewestPendingSuggestion( {}, null ) ).toBeNull();
		expect( findNewestPendingSuggestion( undefined, null ) ).toBeNull();
	} );

	it( 'ignores entries whose overlay equals their baseline', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 2 },
				lastEditSeq: 5,
			},
		};
		expect( findNewestPendingSuggestion( entries, null ) ).toBeNull();
	} );

	it( 'ignores unstamped attribute entries', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
			},
		};
		expect( findNewestPendingSuggestion( entries, null ) ).toBeNull();
	} );

	it( 'picks the most recently edited pending attribute entry', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 4,
			},
			'block-2': {
				baselineAttributes: { content: 'A' },
				overlayAttributes: { content: 'B' },
				lastEditSeq: 8,
			},
		};
		expect( findNewestPendingSuggestion( entries, null ) ).toEqual( {
			kind: 'attribute',
			clientId: 'block-2',
			entry: entries[ 'block-2' ],
			seq: 8,
		} );
	} );

	it( 'includes a structural entry only while its pending marker is live', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-move' },
				structuralOpSeq: 9,
			},
		};
		const withMarker = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-move' } },
			} ),
		};
		expect( findNewestPendingSuggestion( entries, withMarker ) ).toEqual( {
			kind: 'structural',
			clientId: 'block-1',
			entry: entries[ 'block-1' ],
			seq: 9,
		} );

		// Marker gone (already resolved or withdrawn): stale overlay state,
		// not a candidate.
		const withoutMarker = {
			getBlockAttributes: () => ( { metadata: {} } ),
		};
		expect(
			findNewestPendingSuggestion( entries, withoutMarker )
		).toBeNull();
	} );

	it( 'marks a block-remove as owned by the real undo stack', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 9,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-remove' } },
			} ),
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'history', clientId: 'block-1', seq: 9 } );
	} );

	it( 'lets a stale block-remove fall away once its marker is gone', () => {
		const entries = {
			'block-1': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 9,
			},
			'block-2': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-insert-after' },
				structuralOpSeq: 4,
			},
		};
		// The removal has already been reverted through history; only the
		// insertion still carries a live marker.
		const blockEditor = {
			getBlockAttributes: ( clientId: string ) =>
				clientId === 'block-2'
					? {
							metadata: {
								suggestion: { type: 'pending-insert' },
							},
						}
					: { metadata: {} },
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'structural', clientId: 'block-2', seq: 4 } );
	} );

	it( 'orders attribute and structural candidates by capture sequence', () => {
		const entries = {
			'block-1': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 12,
			},
			'block-2': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-move' },
				structuralOpSeq: 7,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-move' } },
			} ),
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'attribute', clientId: 'block-1' } );
	} );

	it( 'lets a newer block-remove shadow an older withdrawable suggestion', () => {
		const entries = {
			'inserted-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-insert-after' },
				structuralOpSeq: 4,
			},
			'doomed-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 5,
			},
		};
		const blockEditor = {
			getBlockAttributes: ( clientId: string ) => ( {
				metadata: {
					suggestion: {
						type:
							clientId === 'doomed-block'
								? 'pending-remove'
								: 'pending-insert',
					},
				},
			} ),
		};
		// Newest-first: the removal is the newer action, so the guard must
		// report it rather than the insertion it could withdraw itself.
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( {
			kind: 'history',
			clientId: 'doomed-block',
			seq: 5,
		} );
	} );

	it( 'lets a newer block-remove shadow an older attribute suggestion', () => {
		const entries = {
			'heading-block': {
				baselineAttributes: { level: 2 },
				overlayAttributes: { level: 3 },
				lastEditSeq: 4,
			},
			'doomed-block': {
				baselineAttributes: {},
				overlayAttributes: {},
				structuralOp: { type: 'block-remove' },
				structuralOpSeq: 5,
			},
		};
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-remove' } },
			} ),
		};
		expect(
			findNewestPendingSuggestion( entries, blockEditor )
		).toMatchObject( { kind: 'history', clientId: 'doomed-block' } );
	} );
} );

describe( 'SuggestionUndoGuard', () => {
	function setup( {
		hasUndo = false,
		hasRedo = false,
		blocks = [] as any[],
	} = {} ) {
		const undo = vi.fn( () => Promise.resolve() );
		const redo = vi.fn( () => Promise.resolve() );
		const registry = createRegistry();
		registry.register(
			createReduxStore( 'core', {
				reducer: ( state = {} ) => state,
				actions: { undo, redo },
				selectors: {
					hasUndo: () => hasUndo,
					hasRedo: () => hasRedo,
					getRawEntityRecord: () => undefined,
					getEntityRecordEdits: () => undefined,
				},
			} )
		);
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.dispatch( blockEditorStore ).resetBlocks( blocks );
		unlock( registry.dispatch( editorStore ) ).setEditorIntent( 'suggest' );

		const overlay: { current: any } = { current: null };
		function Probe() {
			overlay.current = useSuggestionOverlay();
			return null;
		}
		render(
			createElement(
				RegistryProvider,
				{ value: registry },
				createElement(
					SuggestionOverlayProvider,
					null,
					createElement( SuggestionUndoGuard ),
					createElement( Probe )
				)
			)
		);
		return { registry, overlay };
	}

	it( 'does not arm an adoption when there is nothing to undo or redo', () => {
		const { registry, overlay } = setup();
		const core: any = registry.dispatch( 'core' );
		core.undo();
		core.redo();
		// A stray token would let the next block edit skip capture.
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( false );
	} );

	it( 'arms one adoption per undo or redo that has a history record', () => {
		const { registry, overlay } = setup( {
			hasUndo: true,
			hasRedo: true,
		} );
		const core: any = registry.dispatch( 'core' );
		core.undo();
		core.redo();
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( true );
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( true );
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( false );
	} );

	it( 'reports a withdrawable suggestion so Undo is offered without core history', () => {
		registerBlockType( 'test/undo-guard', {
			apiVersion: 3,
			title: 'Test',
			category: 'text',
			attributes: { level: { type: 'number', default: 2 } },
			save: () => null,
		} );
		const block = createBlock( 'test/undo-guard' );
		const { registry, overlay } = setup( { blocks: [ block ] } );
		const editor = unlock( registry.select( editorStore ) );
		expect( editor.hasSuggestionUndo() ).toBe( false );

		act( () => {
			overlay.current.captureBaseline(
				block.clientId,
				'test/undo-guard',
				{
					level: 2,
				}
			);
			overlay.current.setOverlayAttributes( block.clientId, {
				level: 3,
			} );
		} );
		expect( editor.hasSuggestionUndo() ).toBe( true );

		act( () => {
			( registry.dispatch( 'core' ) as any ).undo();
		} );
		expect( editor.hasSuggestionUndo() ).toBe( false );
	} );
} );
