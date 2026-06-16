/**
 * External dependencies
 */
import { render, screen, act, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { createBlock, registerBlockType } from '@wordpress/blocks';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import withSuggestionOverlay, {
	mergeOverlayAttributes,
	structuralMarkerClass,
	withSuggestionBlockClassName,
} from '../with-suggestion-overlay';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

function renderWithProviders( ui, { intent = 'edit', blocks = null } = {} ) {
	const registry = createRegistry();
	// `setEditorIntent` dispatches a snackbar via the notices store when
	// the intent actually changes, so the store needs to be registered even
	// in tests that only care about the overlay HOC.
	registry.register( noticesStore );
	registry.register( editorStore );
	// `blockEditorStore` is only registered when the test passes `blocks`.
	// Registering it unconditionally activates the overlay provider's
	// orphan-prune effect — it short-circuits when
	// `getClientIdsWithDescendants` is unavailable — which would then
	// prune any overlay entry whose `clientId` doesn't correspond to a
	// real block. Most tests use a synthetic `clientId="a"` and never
	// register a matching block, so the entry would be pruned the
	// moment `captureBaseline` creates it.
	if ( blocks ) {
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.dispatch( blockEditorStore ).resetBlocks( blocks );
	}
	registry.dispatch( editorStore ).setEditorIntent( intent );

	const wrapper = ( { children } ) => (
		<RegistryProvider value={ registry }>
			<SuggestionOverlayProvider>{ children }</SuggestionOverlayProvider>
		</RegistryProvider>
	);

	return {
		registry,
		...render( ui, { wrapper } ),
	};
}

// Minimal block component that exposes its received attributes and
// calls setAttributes when its button is clicked.
function FakeBlock( { attributes, setAttributes } ) {
	return (
		<>
			<div data-testid="content">{ attributes?.content ?? '' }</div>
			<button
				type="button"
				onClick={ () => setAttributes( { content: 'proposed' } ) }
			>
				edit
			</button>
		</>
	);
}

const Wrapped = withSuggestionOverlay( FakeBlock );

describe( 'withSuggestionOverlay', () => {
	it( 'passes through unchanged in Edit intent', () => {
		const setAttributes = jest.fn();
		renderWithProviders(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'Hello' } }
				setAttributes={ setAttributes }
			/>
		);

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent( 'Hello' );

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'diverts setAttributes into the overlay in Suggest intent', () => {
		const setAttributes = jest.fn();
		renderWithProviders(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'Hello' } }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest' }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		// Real setAttributes is never called; block renders merged value.
		expect( setAttributes ).not.toHaveBeenCalled();
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
	} );

	it( 'writes setAttributes through (no overlay) for a pending-insert block in Suggest intent', () => {
		// A pending-insert block has no "before" worth preserving — the
		// block itself is the suggestion. Routing edits through the
		// overlay would trap the suggester's typed content on the
		// suggester's peer; the reviewer needs to see it as part of the
		// preview, so the edit must hit the real attributes and sync via
		// CRDT like any other block change.
		registerBlockType( 'core/test-pending-insert', {
			apiVersion: 3,
			title: 'Test',
			category: 'text',
			attributes: {
				content: { type: 'string', default: '' },
				metadata: { type: 'object' },
			},
			save() {
				return null;
			},
		} );
		const block = createBlock( 'core/test-pending-insert', {
			content: 'Hello',
			metadata: { suggestion: { type: 'pending-insert' } },
		} );

		const setAttributes = jest.fn();
		renderWithProviders(
			<Wrapped
				clientId={ block.clientId }
				name="core/test-pending-insert"
				attributes={ block.attributes }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest', blocks: [ block ] }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 'merges overlay on top of real attributes for rendering', () => {
		const setAttributes = jest.fn();
		const { rerender } = renderWithProviders(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'Hello', level: 2 } }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'suggest' }
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);

		// Real attributes update (e.g., from RTC sync). Overlay wins on
		// overlapping keys; non-overlapping keys reflect the new real value.
		rerender(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'UPSTREAM', level: 3 } }
				setAttributes={ setAttributes }
			/>
		);
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
	} );

	it( 'passes through in View intent — no overlay, no diversion', () => {
		const setAttributes = jest.fn();
		renderWithProviders(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'Untouched' } }
				setAttributes={ setAttributes }
			/>,
			{ intent: 'view' }
		);

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'Untouched'
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		// In view intent the HOC is a pass-through, so the real
		// setAttributes is invoked and the overlay is never used.
		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( 're-captures baseline when overlay is cleared then re-edited', () => {
		// Regression: after Submit/Discard clears the overlay entry, a
		// later edit must create a new baseline + overlay rather than
		// silently no-oping.
		let clearOverlayHandle;
		function Harness() {
			const { clearOverlay } = useSuggestionOverlay();
			clearOverlayHandle = clearOverlay;
			return null;
		}

		const setAttributes = jest.fn();
		renderWithProviders(
			<>
				<Harness />
				<Wrapped
					clientId="a"
					name="core/paragraph"
					attributes={ { content: 'Hello' } }
					setAttributes={ setAttributes }
				/>
			</>,
			{ intent: 'suggest' }
		);

		// First edit — creates overlay.
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);

		// Simulate Submit/Discard clearing the overlay.
		act( () => {
			clearOverlayHandle( 'a' );
		} );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent( 'Hello' );

		// Second edit — must capture a new baseline and record the
		// overlay, not silently no-op.
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
		// The real setAttributes is still never invoked in suggest mode.
		expect( setAttributes ).not.toHaveBeenCalled();
	} );
} );

describe( 'mergeOverlayAttributes', () => {
	it( 'returns base unchanged when there is no overlay', () => {
		const base = { content: 'Hello', level: 2 };
		expect( mergeOverlayAttributes( base, null ) ).toBe( base );
		expect( mergeOverlayAttributes( base, undefined ) ).toBe( base );
	} );

	it( 'replaces primitive overlay values wholesale', () => {
		expect(
			mergeOverlayAttributes(
				{ content: 'Hello', level: 2 },
				{ level: 3 }
			)
		).toEqual( { content: 'Hello', level: 3 } );
	} );

	it( 'one-level merges the style attribute so untouched fields survive', () => {
		expect(
			mergeOverlayAttributes(
				{
					style: {
						typography: { fontSize: '16px' },
						color: 'red',
					},
				},
				{ style: { color: 'blue' } }
			)
		).toEqual( {
			style: {
				typography: { fontSize: '16px' },
				color: 'blue',
			},
		} );
	} );

	it( 'one-level merges metadata so e.g. noteId survives a name change', () => {
		expect(
			mergeOverlayAttributes(
				{ metadata: { name: 'Block A', noteId: 42 } },
				{ metadata: { name: 'Block B' } }
			)
		).toEqual( {
			metadata: { name: 'Block B', noteId: 42 },
		} );
	} );

	it( 'replaces array-valued attributes wholesale (no merge)', () => {
		expect(
			mergeOverlayAttributes(
				{ classes: [ 'a', 'b' ] },
				{ classes: [ 'c' ] }
			)
		).toEqual( { classes: [ 'c' ] } );
	} );

	it( 'replaces non-deep-merge object attributes wholesale', () => {
		// `metadata` and `style` are deep-merged; everything else is
		// replaced even if it happens to be an object.
		expect(
			mergeOverlayAttributes(
				{ custom: { nested: 'old' } },
				{ custom: { other: 'new' } }
			)
		).toEqual( { custom: { other: 'new' } } );
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

	function FakeBlockListBlock( { className, wrapperProps } ) {
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

	function setup( { intent = 'edit', metadata } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditorIntent( intent );

		const block = createBlock( TEST_BLOCK_NAME, {
			content: 'Hello',
			...( metadata !== undefined && { metadata } ),
		} );
		registry.dispatch( blockEditorStore ).resetBlocks( [ block ] );

		const wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					{ children }
				</SuggestionOverlayProvider>
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

	function setupMove( { withMove = true } = {} ) {
		const registry = createRegistry();
		registry.register( noticesStore );
		registry.register( preferencesStore );
		registry.register( blockEditorStore );
		registry.register( editorStore );
		registry.dispatch( editorStore ).setEditorIntent( 'edit' );

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

		const wrapper = ( { children } ) => (
			<RegistryProvider value={ registry }>
				<SuggestionOverlayProvider>
					{ children }
				</SuggestionOverlayProvider>
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
} );
