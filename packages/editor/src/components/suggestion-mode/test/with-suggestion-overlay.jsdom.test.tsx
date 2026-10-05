/**
 * Tests for `with-suggestion-overlay.tsx`. Coverage falls into two groups:
 *
 * 1. `withSuggestionOverlay` HOC: pass-through outside Suggest intent for a
 *    block with no proposal; in Suggest intent, diversion of `setAttributes`
 *    into the block's `metadata.suggestion.after`, rendering the proposal
 *    merged over the live attributes in every intent, clearing the marker
 *    when the proposal returns to the live value, and handing text/format
 *    edits off to the marker path instead.
 * 2. `withSuggestionBlockClassName`: the bracket class for a proposal and
 *    the structural classes for structural markers.
 */
import { beforeAll, describe, expect, it, vi } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import type { ReactElement, ReactNode } from 'react';
import {
	RegistryProvider,
	createReduxStore,
	createRegistry,
	useSelect,
} from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as noticesStore } from '@wordpress/notices';
// @ts-expect-error No exported types
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';
import { RichTextData, unregisterFormatType } from '@wordpress/rich-text';
import withSuggestionOverlay, {
	structuralMarkerClass,
	withSuggestionBlockClassName,
} from '../with-suggestion-overlay';
import { MoveGhostsProvider } from '../use-move-ghosts';
import {
	SuggestionSessionProvider,
	useSuggestionSession,
	useSuggestionSessionActions,
} from '../suggestion-session';
import {
	registerSuggestionFormat,
	SUGGESTION_FORMAT_NAME,
} from '../../inline-suggestions';
import { store as editorStore } from '../../../store';
import { unlock } from '../../../lock-unlock';

// The editor store pulls in `@wordpress/viewport`, which reads
// `window.matchMedia` while loading.
vi.hoisted( () => {
	globalThis.wpVitest.mockMatchMedia();
} );

const HOC_BLOCK = 'core/test-suggestion-hoc';

beforeAll( () => {
	registerBlockType( HOC_BLOCK, {
		apiVersion: 3,
		title: 'Test',
		category: 'text',
		attributes: {
			content: { type: 'string', default: '' },
			level: { type: 'number', default: 2 },
			metadata: { type: 'object' },
		},
		save() {
			return null;
		},
	} );
} );

/*
 * `setEditorIntent( 'suggest' )` reads the current post so it can discard a
 * staged status edit, and both reads go through `core`. These registries are
 * minimal, so answer the two selectors with nothing.
 */
function createStubCoreStore() {
	return createReduxStore( 'core', {
		reducer: ( state: any = {} ) => state,
		selectors: {
			getRawEntityRecord: () => undefined,
			getEntityRecordEdits: () => undefined,
			getCurrentUser: () => undefined,
		},
	} );
}

function createTestRegistry( intent: string, blocks: any[] ) {
	const registry = createRegistry();
	// `setEditorIntent` dispatches a snackbar via the notices store when
	// the intent actually changes, so the store needs to be registered even
	// in tests that only care about the HOC.
	registry.register( noticesStore );
	// `setEditorIntent` compares the editor mode across the change so it can
	// announce a canvas swap, and `getEditorMode` reads the preferences
	// store.
	registry.register( preferencesStore );
	registry.register( editorStore );
	registry.register( createStubCoreStore() );
	registry.register( blockEditorStore );
	registry.dispatch( blockEditorStore ).resetBlocks( blocks );
	unlock( registry.dispatch( editorStore ) ).setEditorIntent( intent );
	return registry;
}

function renderWithProviders(
	ui: ReactElement,
	{ intent = 'edit', blocks = [] }: { intent?: string; blocks?: any[] } = {}
) {
	const registry = createTestRegistry( intent, blocks );
	const wrapper = ( { children }: { children?: ReactNode } ) => (
		<RegistryProvider value={ registry }>
			<SuggestionSessionProvider>{ children }</SuggestionSessionProvider>
		</RegistryProvider>
	);
	return {
		registry,
		...render( ui, { wrapper } ),
	};
}

// Minimal block component that exposes its received attributes and
// calls setAttributes when its buttons are clicked.
function FakeBlock( { attributes, setAttributes }: any ) {
	return (
		<>
			<div data-testid="content">
				{ String( attributes?.content ?? '' ) }
			</div>
			<div data-testid="level">{ attributes?.level ?? '' }</div>
			<button
				type="button"
				onClick={ () => setAttributes( { content: 'proposed' } ) }
			>
				edit
			</button>
			<button
				type="button"
				onClick={ () => setAttributes( { level: 3 } ) }
			>
				edit level
			</button>
			<button
				type="button"
				onClick={ () => setAttributes( { level: 2 } ) }
			>
				reset level
			</button>
		</>
	);
}

const Wrapped = withSuggestionOverlay( FakeBlock );

/*
 * The editor hands `BlockEdit` the block's live attributes from the store;
 * this harness does the same so a marker the HOC writes flows back in as a
 * prop on the next render.
 */
function Connected( {
	clientId,
	setAttributes,
	Component = Wrapped,
}: {
	clientId: string;
	setAttributes: any;
	Component?: any;
} ) {
	const { attributes, name } = useSelect(
		( select ) => ( {
			attributes:
				select( blockEditorStore ).getBlockAttributes( clientId ),
			name: select( blockEditorStore ).getBlockName( clientId ),
		} ),
		[ clientId ]
	);
	return (
		<Component
			clientId={ clientId }
			name={ name }
			attributes={ attributes }
			setAttributes={ setAttributes }
		/>
	);
}

const markerOf = ( registry: any, clientId: string ) =>
	registry.select( blockEditorStore ).getBlockAttributes( clientId )?.metadata
		?.suggestion;

describe( 'withSuggestionOverlay', () => {
	it( 'passes through unchanged in Edit intent', () => {
		const setAttributes = vi.fn();
		const block = createBlock( HOC_BLOCK, { content: 'Hello' } );
		renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
			/>,
			{ blocks: [ block ] }
		);

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent( 'Hello' );

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'writes a proposal into the block marker in Suggest intent', () => {
		const setAttributes = vi.fn();
		const block = createBlock( HOC_BLOCK, { content: 'Hello', level: 2 } );
		const { registry } = renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit level' } ) );

		// The real setter is never called; the live block stays at the
		// baseline and the proposal lives in its marker.
		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markerOf( registry, block.clientId ) ).toEqual( {
			type: 'pending-attributes',
			authorId: null,
			after: { level: 3 },
		} );
		expect(
			registry
				.select( blockEditorStore )
				.getBlockAttributes( block.clientId ).level
		).toBe( 2 );
		// The block renders the proposal.
		expect( screen.getByTestId( 'level' ) ).toHaveTextContent( '3' );
	} );

	it( 'bumps the history capture stamp on a proposal write', () => {
		let seq!: () => number;
		function Probe() {
			const { getLastContentCaptureSeq } = useSuggestionSessionActions();
			useEffect( () => {
				seq = getLastContentCaptureSeq;
			}, [ getLastContentCaptureSeq ] );
			return null;
		}
		const block = createBlock( HOC_BLOCK, { content: 'Hello', level: 2 } );
		renderWithProviders(
			<>
				<Probe />
				<Connected
					clientId={ block.clientId }
					setAttributes={ vi.fn() }
				/>
			</>,
			{ intent: 'suggest', blocks: [ block ] }
		);
		const before = seq();
		fireEvent.click( screen.getByRole( 'button', { name: 'edit level' } ) );
		expect( seq() ).toBeGreaterThan( before );
	} );

	it( 'hands a text edit off to the content reconciler instead of the marker', () => {
		const setAttributes = vi.fn();
		const handler = vi.fn();

		// Registers a content handler so `requestContentSuggestion` takes
		// ownership of the edit, standing in for the mounted reconciler.
		function RegisterContentHandler() {
			const { registerContentHandler } = useSuggestionSession();
			useEffect(
				() => registerContentHandler( handler ),
				[ registerContentHandler ]
			);
			return null;
		}

		// Paragraph content is always `RichTextData` in the editor; the
		// planner declines plain strings. `createBlock` would sanitize the
		// wrapper away for this test block's string attribute, so it is
		// written to the store directly.
		const block = createBlock( HOC_BLOCK, { content: 'Hello' } );
		const registry = createTestRegistry( 'suggest', [ block ] );
		registry
			.dispatch( blockEditorStore )
			.updateBlockAttributes( block.clientId, {
				content: RichTextData.fromHTMLString( 'Hello' ),
			} );
		render(
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<RegisterContentHandler />
					<Connected
						clientId={ block.clientId }
						setAttributes={ setAttributes }
					/>
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		// The reconciler receives the block, the pre-edit value, and a marker
		// plan whose actions all open a fresh note.
		expect( handler ).toHaveBeenCalledTimes( 1 );
		const request = handler.mock.calls[ 0 ][ 0 ];
		expect( request ).toEqual(
			expect.objectContaining( {
				clientId: block.clientId,
				blockName: HOC_BLOCK,
			} )
		);
		expect( String( request.prevContent ) ).toBe( 'Hello' );
		expect( request.plan.actions.length ).toBeGreaterThan( 0 );
		expect(
			request.plan.actions.every( ( action: any ) => action.newNote )
		).toBe( true );

		// The reconciler took ownership: the edit is neither written through
		// nor diverted into a proposal, so the block still shows its original
		// value (the reconciler writes the marker itself, out of band).
		expect( setAttributes ).not.toHaveBeenCalled();
		expect( markerOf( registry, block.clientId ) ).toBeUndefined();
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent( 'Hello' );
	} );

	it( 'declines an edit that would bury a live marker under a proposal', () => {
		// A proposal is marker-free by construction and renders in place of
		// the block's live value, so capturing one for an attribute that
		// still holds a marker hides that marker while its note keeps
		// describing it - the block would carry both representations of a
		// pending change at once (#73411, F-09). The edit is declined instead.
		registerSuggestionFormat();
		try {
			const marked =
				'Hello <mark class="wp-suggestion" data-suggestion-id="9" data-suggestion-type="del">doomed</mark>';
			const setAttributes = vi.fn();
			const block = createBlock( HOC_BLOCK, { content: marked } );
			const { registry } = renderWithProviders(
				<Connected
					clientId={ block.clientId }
					setAttributes={ setAttributes }
				/>,
				{ intent: 'suggest', blocks: [ block ] }
			);

			fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

			// No proposal, and the block was not written through either:
			// the marker and its note are left exactly as they were.
			expect( markerOf( registry, block.clientId ) ).toBeUndefined();
			expect( setAttributes ).not.toHaveBeenCalled();
			// The user is told why, rather than the edit vanishing silently.
			// (The intent switch itself announces a snackbar, hence the find.)
			const refusal = registry
				.select( noticesStore )
				.getNotices()
				.find( ( notice ) =>
					notice.content.includes( 'overlaps a pending suggestion' )
				);
			expect( refusal ).toBeDefined();
			expect( refusal!.status ).toBe( 'warning' );
		} finally {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'proposes only the changed attribute on a block whose content holds a marker', () => {
		// An attribute suggestion that leaves the marked attribute alone (a
		// heading level change on a block whose content holds someone's
		// marker) still becomes a proposal - it neither hides the marker nor
		// competes with it - and the proposal names only that attribute, so
		// the marked content is never replayed on accept.
		registerSuggestionFormat();
		try {
			const marked =
				'Hello <mark class="wp-suggestion" data-suggestion-id="9" data-suggestion-type="del">doomed</mark>';
			const block = createBlock( HOC_BLOCK, {
				content: marked,
				level: 2,
			} );
			const { registry } = renderWithProviders(
				<Connected
					clientId={ block.clientId }
					setAttributes={ vi.fn() }
				/>,
				{ intent: 'suggest', blocks: [ block ] }
			);

			fireEvent.click(
				screen.getByRole( 'button', { name: 'edit level' } )
			);

			expect( markerOf( registry, block.clientId ).after ).toEqual( {
				level: 3,
			} );
			// The block renders the proposed level over its still-marked
			// content: the proposal covers one attribute, not the whole block.
			expect( screen.getByTestId( 'level' ) ).toHaveTextContent( '3' );
			expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
				'wp-suggestion'
			);
		} finally {
			unregisterFormatType( SUGGESTION_FORMAT_NAME );
		}
	} );

	it( 'evaluates updater functions against the proposal, including updates before a render', () => {
		function UpdaterBlock( { attributes, setAttributes }: any ) {
			return (
				<>
					<div data-testid="content">{ attributes.content }</div>
					<button
						type="button"
						onClick={ () => {
							const append = ( current: any ) => ( {
								content: current.content + '!',
							} );
							setAttributes( append );
							setAttributes( append );
						} }
					>
						edit
					</button>
				</>
			);
		}
		const WrappedUpdater = withSuggestionOverlay( UpdaterBlock );
		const setAttributes = vi.fn();
		const block = createBlock( HOC_BLOCK, { content: 'Hello' } );
		renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
				Component={ WrappedUpdater }
			/>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'Hello!!!!'
		);
	} );

	it( 'hands a multi-selection update to the real setter so every selected block changes', () => {
		// The real setter applies the change to each selected block; the
		// store interceptor then captures one suggestion per block.
		const first = createBlock( HOC_BLOCK, { content: 'One' } );
		const second = createBlock( HOC_BLOCK, { content: 'Two' } );

		const setAttributes = vi.fn();
		const { registry } = renderWithProviders(
			<Connected
				clientId={ first.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ first, second ] }
		);
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.multiSelect( first.clientId, second.clientId );
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'writes setAttributes through (no proposal) for a pending-insert block in Suggest intent', () => {
		// A pending-insert block has no "before" worth preserving: the block
		// itself is the suggestion. Diverting edits into a proposal would
		// hide the suggester's typed content from the preview; the edit must
		// hit the real attributes and sync via CRDT like any other change.
		const block = createBlock( HOC_BLOCK, {
			content: 'Hello',
			metadata: { suggestion: { type: 'pending-insert' } },
		} );

		const setAttributes = vi.fn();
		renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'writes setAttributes through for a block nested inside a pending-insert block', () => {
		// The children of a Group that is itself a suggested insertion are
		// part of the Group's insertion: their edits must write through
		// (and stay inside the single "Insert block" suggestion) rather
		// than opening a separate proposal per child.
		const child = createBlock( HOC_BLOCK, { content: 'Child' } );
		const parent = createBlock(
			HOC_BLOCK,
			{
				content: 'Parent',
				metadata: { suggestion: { type: 'pending-insert' } },
			},
			[ child ]
		);

		const setAttributes = vi.fn();
		renderWithProviders(
			<Connected
				clientId={ child.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ parent ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'writes setAttributes through while the block is a deferred insertion', () => {
		// An empty default block appended in Suggest mode is not registered
		// as a suggestion until it gains content (the interceptor defers it
		// and publishes the deferral). Its first edit must land on the real
		// attributes so the interceptor can register the WHOLE block as one
		// insertion, not divert into a proposal.
		let session!: ReturnType< typeof useSuggestionSession >;
		function CaptureSession() {
			const value = useSuggestionSession();
			// Assigned in an effect (not during render) to keep the harness
			// compliant with the react-hooks purity rules.
			useEffect( () => {
				session = value;
			}, [ value ] );
			return null;
		}

		const block = createBlock( HOC_BLOCK, { content: '' } );
		const setAttributes = vi.fn();
		const { registry } = renderWithProviders(
			<>
				<CaptureSession />
				<Connected
					clientId={ block.clientId }
					setAttributes={ setAttributes }
				/>
			</>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		act( () => {
			session.markDeferredInsertion( block.clientId );
		} );

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );

		// Once the deferral is lifted (and absent a pending-insert marker),
		// edits become proposals again.
		act( () => {
			session.unmarkDeferredInsertion( block.clientId );
		} );
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( setAttributes ).toHaveBeenCalledTimes( 1 );
		expect( markerOf( registry, block.clientId ).after ).toEqual( {
			content: 'proposed',
		} );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
	} );

	it.each( [ 'edit', 'suggest', 'view' ] )(
		'merges the proposal over the live attributes for rendering in %s intent',
		( intent ) => {
			const block = createBlock( HOC_BLOCK, {
				content: 'Hello',
				level: 2,
				metadata: {
					suggestion: {
						type: 'pending-attributes',
						after: { level: 3 },
					},
				},
			} );
			renderWithProviders(
				<Connected
					clientId={ block.clientId }
					setAttributes={ vi.fn() }
				/>,
				{ intent, blocks: [ block ] }
			);
			expect( screen.getByTestId( 'level' ) ).toHaveTextContent( '3' );
			expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
				'Hello'
			);
		}
	);

	it( 'keeps the proposal on top when the live attributes change underneath it', () => {
		const block = createBlock( HOC_BLOCK, { content: 'Hello', level: 2 } );
		const { registry } = renderWithProviders(
			<Connected clientId={ block.clientId } setAttributes={ vi.fn() } />,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);

		// Live attributes update (e.g. from RTC sync). The proposal wins on
		// overlapping keys; non-overlapping keys reflect the new live value.
		act( () => {
			registry
				.dispatch( blockEditorStore )
				.updateBlockAttributes( block.clientId, {
					content: 'UPSTREAM',
					level: 4,
				} );
		} );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
		expect( screen.getByTestId( 'level' ) ).toHaveTextContent( '4' );
	} );

	it( 'passes through in View intent for a block with no proposal', () => {
		const setAttributes = vi.fn();
		const block = createBlock( HOC_BLOCK, { content: 'Untouched' } );
		renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'view', blocks: [ block ] }
		);

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'Untouched'
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		// In view intent the HOC is a pass-through, so the real
		// setAttributes is invoked and no proposal is written.
		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'clears the marker when the proposal returns to the live value', () => {
		const setAttributes = vi.fn();
		const block = createBlock( HOC_BLOCK, { content: 'Hello', level: 2 } );
		const { registry } = renderWithProviders(
			<Connected
				clientId={ block.clientId }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit level' } ) );
		expect( markerOf( registry, block.clientId ).after ).toEqual( {
			level: 3,
		} );

		// Back to the baseline: nothing is proposed, so nothing is pending.
		fireEvent.click(
			screen.getByRole( 'button', { name: 'reset level' } )
		);
		expect( markerOf( registry, block.clientId ) ).toBeUndefined();
		expect( screen.getByTestId( 'level' ) ).toHaveTextContent( '2' );

		// A later edit opens a fresh proposal rather than silently no-oping.
		fireEvent.click( screen.getByRole( 'button', { name: 'edit level' } ) );
		expect( markerOf( registry, block.clientId ).after ).toEqual( {
			level: 3,
		} );
		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'structuralMarkerClass', () => {
	it( 'maps each known marker type to its class', () => {
		expect( structuralMarkerClass( 'pending-remove' ) ).toBe(
			'is-suggestion-pending-remove'
		);
		expect( structuralMarkerClass( 'pending-insert' ) ).toBe(
			'is-suggestion-pending-insert'
		);
		expect( structuralMarkerClass( 'pending-move' ) ).toBe(
			'is-suggestion-pending-move'
		);
	} );

	it( 'returns null for unknown or missing types', () => {
		expect( structuralMarkerClass( undefined ) ).toBeNull();
		expect( structuralMarkerClass( 'something-else' ) ).toBeNull();
	} );
} );

describe( 'withSuggestionBlockClassName', () => {
	const TEST_BLOCK_NAME = 'core/test-suggestion-classname';

	beforeAll( () => {
		registerBlockType( TEST_BLOCK_NAME, {
			apiVersion: 3,
			title: 'Test Block',
			category: 'text',
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save() {
				return null;
			},
		} );
	} );

	function FakeBlockListBlock( { className, wrapperProps }: any ) {
		return (
			<div
				data-testid="block-list-block"
				className={ className }
				{ ...wrapperProps }
			/>
		);
	}

	const WrappedBlockListBlock =
		withSuggestionBlockClassName( FakeBlockListBlock );

	function setup( {
		intent = 'edit',
		metadata,
	}: { intent?: string; metadata?: Record< string, any > } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.register( createStubCoreStore() );
		unlock( registry.dispatch( editorStore ) ).setEditorIntent( intent );

		const block = createBlock( TEST_BLOCK_NAME, {
			content: 'Hello',
			...( metadata !== undefined && { metadata } ),
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		const wrapper = ( { children }: { children?: ReactNode } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					{ children }
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		render( <WrappedBlockListBlock clientId={ block.clientId } />, {
			wrapper,
		} );
		return screen.getByTestId( 'block-list-block' );
	}

	it( 'applies is-suggestion-pending-remove for an admin (Edit intent) — the marker is the only signal a reviewer has that a structural change is pending', () => {
		const node = setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-remove' } },
		} );
		expect( node.className ).toContain( 'is-suggestion-pending-remove' );
	} );

	it( 'applies is-suggestion-pending-insert for an admin (Edit intent)', () => {
		const node = setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-insert' } },
		} );
		expect( node.className ).toContain( 'is-suggestion-pending-insert' );
	} );

	it( 'applies is-suggestion-pending-move for an admin (Edit intent)', () => {
		const node = setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		expect( node.className ).toContain( 'is-suggestion-pending-move' );
	} );

	it( 'localizes the destination move tab via a data attribute', () => {
		const node = setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		// CSS renders the tab from this attribute, so the visible label is
		// translatable instead of a hardcoded English string.
		expect( node ).toHaveAttribute(
			'data-suggestion-move-label',
			'Suggested move'
		);
	} );

	it( 'exposes the move destination to assistive tech', () => {
		setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		// The CSS tab isn't reliably announced, so a visually-hidden cue
		// gives screen-reader users the destination signal.
		expect(
			screen.getByText( 'Suggested move destination.' )
		).toBeInTheDocument();
	} );

	it( 'adds no move data attribute or cue for non-move markers', () => {
		const node = setup( {
			intent: 'edit',
			metadata: { suggestion: { type: 'pending-remove' } },
		} );
		expect( node ).not.toHaveAttribute( 'data-suggestion-move-label' );
		expect(
			screen.queryByText( 'Suggested move destination.' )
		).not.toBeInTheDocument();
	} );

	it( 'applies the structural class for the suggester (Suggest intent) too', () => {
		const node = setup( {
			intent: 'suggest',
			metadata: { suggestion: { type: 'pending-move' } },
		} );
		expect( node.className ).toContain( 'is-suggestion-pending-move' );
	} );

	it( 'applies no suggestion class when the block has no marker', () => {
		const node = setup( { intent: 'edit' } );
		expect( node.className ).not.toMatch( /is-suggestion-pending/ );
	} );

	it( 'applies is-suggestion-pending for a marker with a proposal in Edit intent', () => {
		const node = setup( {
			intent: 'edit',
			metadata: {
				suggestion: { type: 'pending-attributes', after: { level: 3 } },
			},
		} );
		expect( node.className ).toContain( 'is-suggestion-pending' );
		expect( node.className ).not.toMatch( /is-suggestion-pending-/ );
	} );

	it( 'applies the bracket next to the structural class when a proposal rides on a move', () => {
		const node = setup( {
			intent: 'suggest',
			metadata: {
				suggestion: { type: 'pending-move', after: { level: 3 } },
			},
		} );
		expect( node.className ).toContain( 'is-suggestion-pending ' );
		expect( node.className ).toContain( 'is-suggestion-pending-move' );
	} );

	it( 'applies no bracket for a structural marker without a proposal', () => {
		const node = setup( {
			intent: 'suggest',
			metadata: { suggestion: { type: 'pending-remove' } },
		} );
		expect( node.className ).not.toMatch( /is-suggestion-pending(\s|$)/ );
		expect( node.className ).toContain( 'is-suggestion-pending-remove' );
	} );

	function setupMove( { withMove = true } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		unlock( registry.dispatch( editorStore ) ).setEditorIntent( 'edit' );

		const anchor = createBlock( TEST_BLOCK_NAME, { content: 'Anchor' } );
		const moved = createBlock( TEST_BLOCK_NAME, {
			content: 'I moved away',
			...( withMove && {
				metadata: {
					suggestion: {
						type: 'pending-move',
						authorId: null,
						fromAnchorClientId: anchor.clientId,
						fromParentClientId: '',
						fromIndex: 1,
					},
				},
			} ),
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ anchor, moved ] );

		const wrapper = ( { children }: { children?: ReactNode } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<MoveGhostsProvider>{ children }</MoveGhostsProvider>
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		// Render the wrapped *anchor* block — the ghost is a sibling of the
		// block that did not move, placed after it.
		render( <WrappedBlockListBlock clientId={ anchor.clientId } />, {
			wrapper,
		} );
	}

	it( 'renders a ghost after a block that is a pending-move anchor', () => {
		setupMove( { withMove: true } );
		expect(
			screen.getByTestId( 'suggestion-move-ghost' )
		).toBeInTheDocument();
	} );

	it( 'renders no ghost when there is no pending move anchored here', () => {
		setupMove( { withMove: false } );
		expect(
			screen.queryByTestId( 'suggestion-move-ghost' )
		).not.toBeInTheDocument();
	} );

	function setupOnlyChildMove() {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		unlock( registry.dispatch( editorStore ) ).setEditorIntent( 'edit' );

		// The block's only child has moved out, leaving the parent empty;
		// the moved block now sits at the root as the parent's sibling.
		const parent = createBlock( TEST_BLOCK_NAME, { content: 'Parent' } );
		const moved = createBlock( TEST_BLOCK_NAME, {
			content: 'I was the only child',
			metadata: {
				suggestion: {
					type: 'pending-move',
					authorId: null,
					fromAnchorClientId: null,
					fromParentClientId: parent.clientId,
					fromIndex: 0,
				},
			},
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ parent, moved ] );

		const wrapper = ( { children }: { children?: ReactNode } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionSessionProvider>
					<MoveGhostsProvider>{ children }</MoveGhostsProvider>
				</SuggestionSessionProvider>
			</RegistryProvider>
		);

		// Render the wrapped *parent* — with no surviving child to anchor to,
		// the ghost falls back to rendering just below the emptied parent.
		render( <WrappedBlockListBlock clientId={ parent.clientId } />, {
			wrapper,
		} );
	}

	it( 'renders a ghost on the old parent when the moved block was an only child', () => {
		setupOnlyChildMove();
		expect(
			screen.getByTestId( 'suggestion-move-ghost' )
		).toBeInTheDocument();
	} );
} );
