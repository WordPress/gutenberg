import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
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
import {
	createBlock,
	registerBlockType,
	unregisterBlockType,
} from '@wordpress/blocks';
import SuggestionUndoGuard, {
	findNewestPendingSuggestion,
} from '../suggestion-undo-guard';
import {
	SuggestionSessionProvider,
	useSuggestionSession,
} from '../suggestion-session';
import { isRecentRedo } from '../decision-state';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const captures = ( entries: Record< string, any > ) =>
	new Map( Object.entries( entries ) );

describe( 'findNewestPendingSuggestion', () => {
	it( 'returns null when nothing is pending', () => {
		expect( findNewestPendingSuggestion( new Map(), null ) ).toBeNull();
		expect( findNewestPendingSuggestion( undefined, null ) ).toBeNull();
	} );

	it( 'includes a structural capture only while its pending marker is live', () => {
		const recorded = captures( {
			'block-1': {
				op: { type: 'block-move' },
				blockName: 'core/paragraph',
				seq: 9,
			},
		} );
		const withMarker = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-move' } },
			} ),
		};
		expect( findNewestPendingSuggestion( recorded, withMarker ) ).toEqual( {
			kind: 'structural',
			clientId: 'block-1',
			capture: recorded.get( 'block-1' ),
			seq: 9,
		} );

		// Marker gone (already resolved or withdrawn): a stale capture, not
		// a candidate.
		const withoutMarker = {
			getBlockAttributes: () => ( { metadata: {} } ),
		};
		expect(
			findNewestPendingSuggestion( recorded, withoutMarker )
		).toBeNull();
	} );

	it( 'marks a block-remove as owned by the real undo stack', () => {
		const recorded = captures( {
			'block-1': {
				op: { type: 'block-remove' },
				blockName: 'core/paragraph',
				seq: 9,
			},
		} );
		const blockEditor = {
			getBlockAttributes: () => ( {
				metadata: { suggestion: { type: 'pending-remove' } },
			} ),
		};
		expect(
			findNewestPendingSuggestion( recorded, blockEditor )
		).toMatchObject( { kind: 'history', clientId: 'block-1', seq: 9 } );
	} );

	it( 'lets a stale block-remove fall away once its marker is gone', () => {
		const recorded = captures( {
			'block-1': {
				op: { type: 'block-remove' },
				blockName: 'core/paragraph',
				seq: 9,
			},
			'block-2': {
				op: { type: 'block-insert-after' },
				blockName: 'core/paragraph',
				seq: 4,
			},
		} );
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
			findNewestPendingSuggestion( recorded, blockEditor )
		).toMatchObject( { kind: 'structural', clientId: 'block-2', seq: 4 } );
	} );

	it( 'lets a newer block-remove shadow an older withdrawable suggestion', () => {
		const recorded = captures( {
			'inserted-block': {
				op: { type: 'block-insert-after' },
				blockName: 'core/paragraph',
				seq: 4,
			},
			'doomed-block': {
				op: { type: 'block-remove' },
				blockName: 'core/paragraph',
				seq: 5,
			},
		} );
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
			findNewestPendingSuggestion( recorded, blockEditor )
		).toMatchObject( {
			kind: 'history',
			clientId: 'doomed-block',
			seq: 5,
		} );
	} );
} );

describe( 'SuggestionUndoGuard', () => {
	function setup( {
		hasUndo = false,
		hasRedo = false,
		blocks = [] as any[],
		intent = 'suggest',
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
		unlock( registry.dispatch( editorStore ) ).setEditorIntent( intent );

		const overlay: { current: any } = { current: null };
		function Probe() {
			overlay.current = useSuggestionSession();
			return null;
		}
		render(
			createElement(
				RegistryProvider,
				{ value: registry },
				createElement(
					SuggestionSessionProvider,
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

	it( 'records a redo in every intent, for the note collector', () => {
		// The post author reviews in Editing intent, and redoing a decision
		// there must not read as a withdrawal.
		const { registry, overlay } = setup( {
			hasRedo: true,
			intent: 'edit',
		} );
		expect( isRecentRedo( registry ) ).toBe( false );
		( registry.dispatch( 'core' ) as any ).redo();
		expect( isRecentRedo( registry ) ).toBe( true );
		// Adoption tokens are for the interceptor, which only runs while
		// suggesting.
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( false );
	} );

	// Registered once for the whole suite: tests run in a shuffled order
	// in CI, so no test may depend on an earlier one having registered it.
	beforeAll( () => {
		registerBlockType( 'test/undo-guard', {
			apiVersion: 3,
			title: 'Test',
			category: 'text',
			attributes: {
				level: { type: 'number', default: 2 },
				metadata: { type: 'object' },
			},
			save: () => null,
		} );
	} );

	afterAll( () => {
		unregisterBlockType( 'test/undo-guard' );
	} );

	it( 'reports a withdrawable structural suggestion so Undo is offered without core history', () => {
		const anchor = createBlock( 'test/undo-guard' );
		const block = createBlock( 'test/undo-guard', {
			metadata: {
				suggestion: {
					type: 'pending-move',
					fromAnchorClientId: null,
					fromParentClientId: null,
					fromIndex: 0,
				},
			},
		} );
		const { registry, overlay } = setup( { blocks: [ anchor, block ] } );
		const editor = unlock( registry.select( editorStore ) );
		expect( editor.hasSuggestionUndo() ).toBe( false );

		act( () => {
			overlay.current.recordStructuralCapture(
				block.clientId,
				'test/undo-guard',
				{
					type: 'block-move',
					clientId: block.clientId,
					fromAnchorClientId: null,
					fromParentClientId: null,
					fromIndex: 0,
				}
			);
			// The capture is a ref; the marker write is what re-renders.
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, { level: 3 } );
		} );
		expect( editor.hasSuggestionUndo() ).toBe( true );

		act( () => {
			( registry.dispatch( 'core' ) as any ).undo();
		} );
		// Withdrawn the way Reject does it: marker gone, block back at its
		// origin, capture dropped, real undo untouched.
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId )?.metadata?.suggestion
		).toBeUndefined();
		expect( registry.select( blockEditorStore ).getBlockOrder() ).toEqual( [
			block.clientId,
			anchor.clientId,
		] );
		expect(
			overlay.current.getStructuralCaptures().has( block.clientId )
		).toBe( false );
		expect( ( registry.dispatch( 'core' ) as any ).undo ).not.toBe(
			undefined
		);
		expect( editor.hasSuggestionUndo() ).toBe( false );
	} );

	it( 'withdrawing a move keeps the proposal that rode on it as its own marker', () => {
		const anchor = createBlock( 'test/undo-guard' );
		const block = createBlock( 'test/undo-guard', {
			metadata: {
				noteId: [ 9 ],
				suggestion: {
					type: 'pending-move',
					authorId: 4,
					commentId: 9,
					fromAnchorClientId: null,
					fromParentClientId: null,
					fromIndex: 0,
					after: { level: 3 },
				},
			},
		} );
		const { registry, overlay } = setup( { blocks: [ anchor, block ] } );
		act( () => {
			overlay.current.recordStructuralCapture(
				block.clientId,
				'test/undo-guard',
				{
					type: 'block-move',
					clientId: block.clientId,
					fromAnchorClientId: null,
					fromParentClientId: null,
					fromIndex: 0,
				}
			);
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, { level: 2 } );
		} );
		act( () => {
			( registry.dispatch( 'core' ) as any ).undo();
		} );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId )?.metadata
		).toEqual( {
			suggestion: {
				type: 'pending-attributes',
				authorId: 4,
				after: { level: 3 },
			},
		} );
	} );

	it( 'stands aside when the newest capture is an attribute proposal (history-owned)', () => {
		const block = createBlock( 'test/undo-guard', {
			metadata: { suggestion: { type: 'pending-move', fromIndex: 0 } },
		} );
		const { registry, overlay } = setup( {
			hasUndo: true,
			blocks: [ block ],
		} );
		const core: any = registry.dispatch( 'core' );

		act( () => {
			overlay.current.recordStructuralCapture(
				block.clientId,
				'test/undo-guard',
				{ type: 'block-move', clientId: block.clientId, fromIndex: 0 }
			);
			// The HOC stamps its proposal write above the structural capture.
			overlay.current.noteHistoryCapture();
		} );

		act( () => {
			core.undo();
		} );
		// The real undo ran (and armed an adoption); the move stays pending.
		expect( overlay.current.consumeUndoRedoAdoption() ).toBe( true );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId )?.metadata?.suggestion
				?.type
		).toBe( 'pending-move' );
	} );
} );
