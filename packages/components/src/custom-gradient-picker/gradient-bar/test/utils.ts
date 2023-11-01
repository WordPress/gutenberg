/**
 * Internal dependencies
 */
import { getHorizontalRelativeGradientPosition } from '../utils';

describe( 'getHorizontalRelativeGradientPosition', () => {
	it( 'should return relative percentage position', () => {
		jest.spyOn(
			window.HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementationOnce(
			() =>
				( {
					x: 0,
					width: 1000,
				} ) as DOMRect
		);

		const containerElement = document.createElement( 'div' );
		expect(
			getHorizontalRelativeGradientPosition( 500, containerElement )
		).toBe( 50 );
	} );

	it( 'should subtract the x position of the container from the mouse position', () => {
		jest.spyOn(
			window.HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementationOnce(
			() =>
				( {
					x: 50,
					width: 1000,
				} ) as DOMRect
		);

		const containerElement = document.createElement( 'div' );
		expect(
			getHorizontalRelativeGradientPosition( 550, containerElement )
		).toBe( 50 );
	} );

	it( 'should clamp to a whole percentage number', () => {
		jest.spyOn(
			window.HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementationOnce(
			() =>
				( {
					x: 0,
					width: 1000,
				} ) as DOMRect
		);

		const containerElement = document.createElement( 'div' );

		expect(
			getHorizontalRelativeGradientPosition( 333, containerElement )
		).toBe( 33 );
	} );

	it( 'should clamp to zero when mouse position is less the x position', () => {
		jest.spyOn(
			window.HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementationOnce(
			() =>
				( {
					x: 50,
					width: 1000,
				} ) as DOMRect
		);
		const containerElement = document.createElement( 'div' );

		expect(
			getHorizontalRelativeGradientPosition( 2, containerElement )
		).toBe( 0 );
	} );

	it( 'should clamp to 100 when mouse position is greater than width', () => {
		jest.spyOn(
			window.HTMLElement.prototype,
			'getBoundingClientRect'
		).mockImplementationOnce(
			() =>
				( {
					x: 50,
					width: 1000,
				} ) as DOMRect
		);

		const containerElement = document.createElement( 'div' );

		expect(
			getHorizontalRelativeGradientPosition( 1500, containerElement )
		).toBe( 100 );
	} );

	it( 'should return undefined if no containerElement is provided', () => {
		const containerElement = null;

		expect(
			getHorizontalRelativeGradientPosition( 1500, containerElement )
		).toBeUndefined();
	} );
} );
