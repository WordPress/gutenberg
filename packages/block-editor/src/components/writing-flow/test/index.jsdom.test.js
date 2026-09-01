import { fireEvent, render, screen } from '@testing-library/react';
import { createElement } from '@wordpress/element';
import { useDispatch, useSelect } from '@wordpress/data';
import { UP, DOWN, LEFT, RIGHT, TAB } from '@wordpress/keycodes';
import { isNavigationCandidate } from '../use-arrow-nav';
import useTabNav from '../use-tab-nav';
import { lock } from '../../../lock-unlock';

jest.mock( '@wordpress/data/src/components/use-select', () => jest.fn() );

jest.mock( '@wordpress/data/src/components/use-dispatch', () => ( {
	useDispatch: jest.fn(),
} ) );

describe( 'isNavigationCandidate', () => {
	let elements;
	beforeAll( () => {
		elements = {};

		elements.inputText = document.createElement( 'input' );
		elements.inputText.setAttribute( 'type', 'text' );

		elements.inputCheckbox = document.createElement( 'input' );
		elements.inputCheckbox.setAttribute( 'type', 'checkbox' );

		elements.inputNumber = document.createElement( 'input' );
		elements.inputNumber.setAttribute( 'type', 'number' );

		elements.contentEditable = document.createElement( 'p' );
		elements.contentEditable.contentEditable = true;
	} );

	it( 'should return true if vertically navigating input without modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'should return false if vertically navigating input with modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				true
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return false if vertically navigating inputs with vertical support like number', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputNumber,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return false if horizontally navigating input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'should return true if horizontally navigating simple inputs like checkboxes', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputCheckbox,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'should return true if horizontally navigating non-input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.contentEditable,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );
} );

describe( 'useTabNav', () => {
	// `useTabNav` reads the block editor store selectors and actions through
	// `unlock()`, so the mocked hook return values have to be locked objects.
	const toLocked = ( privateData ) => {
		const object = {};
		lock( object, privateData );
		return object;
	};

	const defaultUseSelectValues = {
		hasMultiSelection: () => false,
		getSelectedBlockClientId: () => null,
		getBlockCount: () => 0,
		getBlockOrder: () => [],
		getLastFocus: () => null,
		getSectionRootClientId: () => null,
		isZoomOut: () => false,
	};

	beforeEach( () => {
		useSelect.mockImplementation( () =>
			toLocked( defaultUseSelectValues )
		);
		useDispatch.mockImplementation( () =>
			toLocked( { setLastFocus: () => {} } )
		);
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	// The focus capture elements (`before`/`after`) are omitted in preview mode
	// to avoid silent tab stops, so both refs are undefined. Rendering only the
	// writing flow container (without `before`/`after`) reproduces that state.
	// `createElement` rather than JSX keeps this a `.js` test file.
	function PreviewModeWritingFlow() {
		const [ , ref ] = useTabNav();
		return createElement(
			'div',
			{ ref },
			createElement( 'button', { type: 'button' }, 'First tabbable' )
		);
	}

	it( 'does not trap focus when the focus capture elements are absent', () => {
		render( createElement( PreviewModeWritingFlow ) );

		const button = screen.getByRole( 'button', { name: 'First tabbable' } );
		button.focus();

		const errorListener = jest.fn();
		window.addEventListener( 'error', errorListener );

		// Shift+Tab from the first (and only) tabbable element: `findPrevious`
		// returns `undefined`, which previously matched the undefined capture
		// refs, cancelling the event and throwing on `undefined.focus()`.
		let notCancelled;
		expect( () => {
			notCancelled = fireEvent.keyDown( button, {
				keyCode: TAB,
				shiftKey: true,
			} );
		} ).not.toThrow();

		window.removeEventListener( 'error', errorListener );

		expect( errorListener ).not.toHaveBeenCalled();
		// `preventDefault` was not called, so focus is free to leave the canvas.
		expect( notCancelled ).toBe( true );
	} );
} );
