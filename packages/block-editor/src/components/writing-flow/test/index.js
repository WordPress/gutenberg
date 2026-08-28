import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { isNavigationCandidate } from '../use-arrow-nav';

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

		elements.inputCombobox = document.createElement( 'input' );
		elements.inputCombobox.setAttribute( 'type', 'text' );
		elements.inputCombobox.setAttribute( 'role', 'combobox' );

		elements.contentEditable = document.createElement( 'p' );
		elements.contentEditable.contentEditable = true;
	} );

	it( 'returns true if vertically navigating input without modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'returns false if vertically navigating input with modifier', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				true
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'returns false if vertically navigating inputs with the combobox role', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputCombobox,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'returns false if vertically navigating inputs with vertical support like number', () => {
		[ UP, DOWN ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputNumber,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'returns false if horizontally navigating number inputs', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputNumber,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'returns false if horizontally navigating input', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputText,
				keyCode,
				false
			);

			expect( result ).toBe( false );
		} );
	} );

	it( 'returns true if horizontally navigating simple inputs like checkboxes', () => {
		[ LEFT, RIGHT ].forEach( ( keyCode ) => {
			const result = isNavigationCandidate(
				elements.inputCheckbox,
				keyCode,
				false
			);

			expect( result ).toBe( true );
		} );
	} );

	it( 'returns true if horizontally navigating non-input', () => {
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
