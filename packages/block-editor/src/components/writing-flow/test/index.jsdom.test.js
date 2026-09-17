import { beforeAll, describe, expect, it } from 'vitest';
import { UP, DOWN, LEFT, RIGHT } from '@wordpress/keycodes';
import { isNavigationCandidate } from '../use-arrow-nav';
import { getEventTarget } from '../get-event-target';

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

describe( 'getEventTarget', () => {
	it( 'returns the first composed path entry when available', () => {
		const host = document.createElement( 'div' );
		const textarea = document.createElement( 'textarea' );
		const event = {
			target: host,
			composedPath: () => [ textarea, host ],
		};

		expect( getEventTarget( event ) ).toBe( textarea );
	} );

	it( 'falls back to event.target when composedPath is unavailable', () => {
		const host = document.createElement( 'div' );
		const event = { target: host };

		expect( getEventTarget( event ) ).toBe( host );
	} );
} );
