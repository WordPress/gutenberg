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
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import withSuggestionOverlay, {
	mergeOverlayAttributes,
	applyDiffMarks,
	stripMarksFromIncoming,
} from '../with-suggestion-overlay';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';
import { getAvatarBorderColor } from '../../collab-sidebar/utils';

function renderWithProviders( ui, { intent = 'edit', blocks = null } = {} ) {
	const registry = createRegistry();
	// `setEditorIntent` dispatches a snackbar via the notices store when
	// the intent actually changes, so the store needs to be registered even
	// in tests that only care about the overlay HOC.
	registry.register( noticesStore );
	registry.register( editorStore );
	// `blockEditorStore` is only registered when the test passes `blocks`.
	// Registering it unconditionally activates the overlay provider's
	// orphan-prune effect, which would clobber overlay entries whose
	// `clientId` doesn't correspond to a real block — most tests use a
	// synthetic `clientId="a"` and never register a matching block.
	// Tests that need `isBlockSelected` to return false (e.g. the
	// hydrated-reviewer scenarios) opt in by passing `blocks` with a
	// matching `clientId`.
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

	it( 'suppresses diff marks while the block is selected so RichText reconciliation does not fight the caret', () => {
		// Regression: a prior implementation flipped the value prop from
		// the clean overlay value to the marked HTML 100 ms after the
		// suggester paused typing. Because the marked render contains
		// `<del>`/`<ins>` wrappers, the suggester's caret could land
		// inside or at the boundary of a format element; the next
		// keystroke would then be stripped (lost into a `<del>`) or
		// prepended to the existing addition (producing reversed
		// insertions like "egap" instead of "page"). Keeping the gate
		// strictly on `isSelected` means RichText never sees the marked
		// value while the caret is live, so editing stays well-formed.
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

		// `renderWithProviders` doesn't register `blockEditorStore`, so
		// `isBlockSelected` falls through to the safe default of `true`
		// — the same condition the HOC sees while a real user has the
		// caret in the block.
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'proposed'
		);
		expect( screen.getByTestId( 'content' ) ).not.toHaveTextContent(
			/<(del|ins)/
		);
	} );

	it( 'wraps for marks but writes through to the real block when a hydrated entry exists outside Suggest intent', () => {
		// Reviewer scenario: the hydrator seeded an overlay entry from a
		// persisted suggestion. The block must render the marked diff
		// (via the wrapping HOC) but any keystrokes the reviewer types into
		// the canvas must land on the real block, not get captured into
		// the suggester's overlay.
		//
		// `blocks` is passed so that the block-editor store is registered
		// and `isBlockSelected('a')` returns false — the reviewer is just
		// looking at the block, not editing it — which is what frees the
		// HOC to render marks.
		function SeedButton() {
			const { seedFromComment } = useSuggestionOverlay();
			return (
				<button
					type="button"
					onClick={ () =>
						seedFromComment(
							'a',
							'core/paragraph',
							42,
							{ content: 'before' },
							{ content: 'after' }
						)
					}
				>
					seed
				</button>
			);
		}

		const setAttributes = jest.fn();
		// Real block content stays at the suggester's recorded baseline
		// (`before`) — that's the production state: until the suggestion
		// is accepted, the live block-editor store still holds the
		// baseline value, and only the overlay carries the proposed
		// `after`.
		renderWithProviders(
			<>
				<SeedButton />
				<Wrapped
					clientId="a"
					name="core/paragraph"
					attributes={ { content: 'before' } }
					setAttributes={ setAttributes }
				/>
			</>,
			{
				intent: 'edit',
				blocks: [
					{
						clientId: 'a',
						name: 'core/paragraph',
						attributes: { content: 'before' },
						innerBlocks: [],
					},
				],
			}
		);

		// Initially there's no entry, so the HOC is a pass-through in
		// Edit intent — no marks, real setAttributes wired up.
		expect( screen.getByTestId( 'content' ) ).not.toHaveTextContent(
			/<(del|ins)/
		);

		// Hydrate from a persisted comment.
		fireEvent.click( screen.getByRole( 'button', { name: 'seed' } ) );

		// Now the wrap is active and the marks render even outside
		// Suggest intent.
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			/<del class="has-suggestion-deletion">before<\/del>/
		);
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			/<ins class="has-suggestion-addition">after<\/ins>/
		);

		// Reviewer types — write goes through to the real block, not
		// the overlay.
		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );
		expect( setAttributes ).toHaveBeenCalledWith( {
			content: 'proposed',
		} );
	} );

	it( "tints a hydrated entry's marks with the suggestion author's color, not the viewer's", () => {
		// Regression: the marks used to be tinted via the current viewer's
		// `getCurrentUser()` id, so a reviewer (or anyone after reload) saw
		// another author's suggestion painted in their own color. The seeded
		// note author must drive the color instead. coreStore is not
		// registered here, so the viewer id resolves to null — if the marks
		// pick up a color at all, it can only come from the seeded author.
		const authorId = 2;
		const expectedColor = getAvatarBorderColor( authorId );

		function SeedButton() {
			const { seedFromComment } = useSuggestionOverlay();
			return (
				<button
					type="button"
					onClick={ () =>
						seedFromComment(
							'a',
							'core/paragraph',
							42,
							{ content: 'before' },
							{ content: 'after' },
							authorId
						)
					}
				>
					seed
				</button>
			);
		}

		const setAttributes = jest.fn();
		renderWithProviders(
			<>
				<SeedButton />
				<Wrapped
					clientId="a"
					name="core/paragraph"
					attributes={ { content: 'before' } }
					setAttributes={ setAttributes }
				/>
			</>,
			{
				intent: 'edit',
				blocks: [
					{
						clientId: 'a',
						name: 'core/paragraph',
						attributes: { content: 'before' },
						innerBlocks: [],
					},
				],
			}
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'seed' } ) );

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			new RegExp(
				`<del class="has-suggestion-deletion" style="--suggestion-author-color: ${ expectedColor }">before</del>`
			)
		);
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			new RegExp(
				`<ins class="has-suggestion-addition" style="--suggestion-author-color: ${ expectedColor }">after</ins>`
			)
		);
	} );

	it( 'drops marks for a hydrated entry when real content has diverged from the suggester baseline', () => {
		// RTC regression: once a reviewer's real block content moves away
		// from the suggester's recorded `before` (their own keystrokes, or
		// a concurrent editor's CRDT-synced change), the overlay merge would
		// otherwise overwrite the reviewer's text with the suggester's stale
		// `after` and the diff marks would visually attribute the reviewer's
		// edits to the suggester. The guard skips the merge in that case.
		function SeedButton() {
			const { seedFromComment } = useSuggestionOverlay();
			return (
				<button
					type="button"
					onClick={ () =>
						seedFromComment(
							'a',
							'core/paragraph',
							42,
							{ content: 'before' },
							{ content: 'after' }
						)
					}
				>
					seed
				</button>
			);
		}

		const setAttributes = jest.fn();
		// Real block content has already diverged from the suggester's
		// recorded baseline (`before`) — e.g. the reviewer just typed.
		renderWithProviders(
			<>
				<SeedButton />
				<Wrapped
					clientId="a"
					name="core/paragraph"
					attributes={ { content: 'reviewer typed' } }
					setAttributes={ setAttributes }
				/>
			</>,
			{
				intent: 'edit',
				blocks: [
					{
						clientId: 'a',
						name: 'core/paragraph',
						attributes: { content: 'reviewer typed' },
						innerBlocks: [],
					},
				],
			}
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'seed' } ) );

		// Real content wins. No del/ins wrappers — the divergence
		// guard skipped the overlay merge and the diff rendering.
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			'reviewer typed'
		);
		expect( screen.getByTestId( 'content' ) ).not.toHaveTextContent(
			/<del/
		);
		expect( screen.getByTestId( 'content' ) ).not.toHaveTextContent(
			/<ins/
		);
	} );

	it( 'keeps marks for the suggester themselves even when overlay attributes diverge from baseline (no reviewer guard)', () => {
		// The divergence guard is reviewer-only — the suggester's overlay
		// is the source of truth and must keep rendering with diff marks
		// regardless of whether the real block content (kept at baseline by
		// the overlay) matches the recorded baseline. This pins the guard
		// to `! isSuggestMode` so a future refactor can't widen it.
		//
		// Registering the block in the editor store makes
		// `isBlockSelected('a')` return false (no block selected), so the
		// HOC's selection gate doesn't suppress marks here.
		const setAttributes = jest.fn();
		renderWithProviders(
			<Wrapped
				clientId="a"
				name="core/paragraph"
				attributes={ { content: 'Hello' } }
				setAttributes={ setAttributes }
			/>,
			{
				intent: 'suggest',
				blocks: [
					{
						clientId: 'a',
						name: 'core/paragraph',
						attributes: { content: 'Hello' },
						innerBlocks: [],
					},
				],
			}
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'edit' } ) );

		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			/<del class="has-suggestion-deletion">Hello<\/del>/
		);
		expect( screen.getByTestId( 'content' ) ).toHaveTextContent(
			/<ins class="has-suggestion-addition">proposed<\/ins>/
		);
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
			'Hello' + '<ins class="has-suggestion-addition"> world</ins>'
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
				'<ins class="has-suggestion-addition" style="--suggestion-author-color: #b26200"> world</ins>'
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
