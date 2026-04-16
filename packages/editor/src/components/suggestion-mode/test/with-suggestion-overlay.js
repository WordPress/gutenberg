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
import withSuggestionOverlay from '../with-suggestion-overlay';
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
