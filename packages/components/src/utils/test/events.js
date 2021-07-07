/**
 * Internal dependencies
 */
import { mergeEventHandlers } from '../events';

describe( 'mergeEventHandlers', () => {
	it( 'should merge the two event handler objects', () => {
		const left = {
			onclick: jest.fn(),
		};

		const right = {
			onclick: jest.fn(),
		};

		const merged = mergeEventHandlers( left, right );

		merged.onclick();

		expect( left.onclick ).toHaveBeenCalled();
		expect( right.onclick ).toHaveBeenCalled();
	} );

	it( 'should preserve all handlers from the left hand side that do not overlap with the right', () => {
		const left = {
			ArrowUp: jest.fn(),
			ArrowDown: jest.fn(),
		};

		const right = {
			ArrowUp: jest.fn(),
		};

		const merged = mergeEventHandlers( left, right );

		merged.ArrowUp();

		expect( left.ArrowUp ).toHaveBeenCalled();
		expect( right.ArrowUp ).toHaveBeenCalled();

		expect( merged.ArrowDown ).toBe( left.ArrowDown );
	} );

	it( 'should preserve all handlers form the right hand side that do not overlap with the left', () => {
		const right = {
			ArrowUp: jest.fn(),
			ArrowDown: jest.fn(),
		};

		const left = {
			ArrowUp: jest.fn(),
		};

		const merged = mergeEventHandlers( left, right );

		merged.ArrowUp();

		expect( left.ArrowUp ).toHaveBeenCalled();
		expect( right.ArrowUp ).toHaveBeenCalled();

		expect( merged.ArrowDown ).toBe( right.ArrowDown );
	} );
} );
