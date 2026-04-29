/**
 * External dependencies
 */
import { render, screen, act, fireEvent } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import withSuggestionOverlay, {
	mergeOverlayAttributes,
} from '../with-suggestion-overlay';
import {
	SuggestionOverlayProvider,
	useSuggestionOverlay,
} from '../overlay-context';
import { store as editorStore } from '../../../store';

function renderWithProviders( ui, { intent = 'edit' } = {} ) {
	const registry = createRegistry();
	registry.register( preferencesStore );
	registry.register( editorStore );
	registry.dispatch( preferencesStore ).set( 'core', 'editorIntent', intent );

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
