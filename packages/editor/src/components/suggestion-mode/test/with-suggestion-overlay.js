/**
 * Tests for `with-suggestion-overlay.js`. Coverage falls into three groups:
 *
 * 1. `withSuggestionOverlay` HOC — pass-through outside Suggest intent;
 *    in Suggest intent, diversion of `setAttributes` into the overlay,
 *    rendering the merged overlay-on-baseline value, surviving an overlay
 *    clear-and-re-edit cycle.
 * 2. `mergeOverlayAttributes` — replace-vs-deep-merge contract for
 *    overlapping overlay keys, including the `style`/`metadata` deep merge
 *    that keeps untouched fields alive.
 * 3. `applyDiffMarks` / `stripMarksFromIncoming` — the diff/strip round-trip
 *    that keeps the overlay storing the *clean* proposed value while the
 *    rendered attributes carry marked HTML.
 */

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
	applyDiffMarks,
	stripMarksFromIncoming,
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

	function FakeBlockListBlock( { className } ) {
		return <div data-testid="block-list-block" className={ className } />;
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

describe( 'applyDiffMarks', () => {
	it( 'returns merged unchanged when no baseline is available', () => {
		// New blocks added during a suggestion session never get a
		// baseline captured for them — `applyDiffMarks` must be a safe
		// no-op rather than throw.
		const merged = { content: 'Hello' };
		expect( applyDiffMarks( merged, null ) ).toBe( merged );
	} );

	it( 'returns merged unchanged when the content attribute is unchanged', () => {
		// Attribute-only suggestions (e.g. heading level) don't touch
		// `content`; skipping the diff keeps object identity stable so
		// React's bail-out on unchanged props still fires.
		const merged = { content: 'Hello', level: 3 };
		const baseline = { content: 'Hello', level: 2 };
		expect( applyDiffMarks( merged, baseline ) ).toBe( merged );
	} );

	it( 'wraps the diff for changed content in del/ins markup', () => {
		const result = applyDiffMarks(
			{ content: 'Hello world', level: 2 },
			{ content: 'Hello', level: 2 }
		);
		expect( result.content ).toBe(
			'Hello' +
				'<ins class="has-suggestion-addition"> </ins>' +
				'<ins class="has-suggestion-addition">world</ins>'
		);
		// Other attributes pass through untouched.
		expect( result.level ).toBe( 2 );
	} );

	it( 'leaves non-rich-text attributes unmarked even when they change', () => {
		// `align: 'left' -> 'right'` is a primitive change; wrapping it
		// in HTML would push garbage into a className/string slot. The
		// block-level outline already signals these changes.
		const merged = { align: 'right' };
		const baseline = { align: 'left' };
		expect( applyDiffMarks( merged, baseline ) ).toBe( merged );
	} );

	it( 'propagates the suggester avatar color into each marked run', () => {
		// HOC resolves the suggester via `getAvatarBorderColor` and passes
		// the hex color through. The marks must carry it inline so two
		// suggesters' edits read as different colors in the canvas.
		const result = applyDiffMarks(
			{ content: 'Hello world' },
			{ content: 'Hello' },
			'#b26200'
		);
		expect( result.content ).toBe(
			'Hello' +
				'<ins class="has-suggestion-addition" style="--suggestion-author-color: #b26200"> </ins>' +
				'<ins class="has-suggestion-addition" style="--suggestion-author-color: #b26200">world</ins>'
		);
	} );
} );

describe( 'stripMarksFromIncoming', () => {
	it( 'returns the payload unchanged when no rich-text key is present', () => {
		// Most attribute-only suggestions land here, so the fast-path
		// matters for keystroke-rate calls.
		const payload = { level: 3 };
		expect( stripMarksFromIncoming( payload ) ).toBe( payload );
	} );

	it( 'returns the payload unchanged when content has no suggestion marks', () => {
		// First-time edits send plain text through; the strip should be
		// a structural no-op so React props stay identity-stable.
		const payload = { content: 'Hello world' };
		expect( stripMarksFromIncoming( payload ) ).toBe( payload );
	} );

	it( 'strips suggestion marks from content before they reach the overlay', () => {
		// Round-trip case: RichText emits the previously-marked HTML
		// back through `setAttributes` after the user keeps typing into
		// a marked block. Storing the marked form in the overlay would
		// double up the marks on the next render.
		const result = stripMarksFromIncoming( {
			content:
				'Hello' +
				'<del class="has-suggestion-deletion"> world</del>' +
				'<ins class="has-suggestion-addition"> there</ins>',
			level: 2,
		} );
		expect( result.content ).toBe( 'Hello there' );
		expect( result.level ).toBe( 2 );
	} );
} );
