import { describe, expect, it } from 'vitest';
import { removeLayoutValues, removeRotation } from '../use-grid-layout-sync';

describe( 'removeLayoutValues()', () => {
	it( 'returns the same style when there is nothing to remove', () => {
		const style = { layout: { columnSpan: 2 } };
		expect( removeLayoutValues( style, [ 'columnStart' ] ) ).toBe( style );
		expect( removeLayoutValues( undefined, [ 'columnStart' ] ) ).toBe(
			undefined
		);
	} );

	it( 'removes the given keys and keeps the rest', () => {
		expect(
			removeLayoutValues(
				{
					color: { text: 'red' },
					layout: { columnStart: 2, rowStart: 1, columnSpan: 2 },
				},
				[ 'columnStart', 'rowStart' ]
			)
		).toEqual( {
			color: { text: 'red' },
			layout: { columnSpan: 2 },
		} );
	} );

	it( 'drops the layout object when it ends up empty', () => {
		expect(
			removeLayoutValues( { layout: { columnStart: 2 } }, [
				'columnStart',
			] )
		).toEqual( { layout: undefined } );
	} );
} );

describe( 'removeRotation()', () => {
	it( 'removes rotation from the default state and every viewport', () => {
		expect(
			removeRotation( {
				layout: { columnStart: 2, rotate: 30 },
				'@tablet': { layout: { rotate: 0, columnStart: 1 } },
				'@mobile': { layout: { rotate: 10 }, spacing: { padding: 0 } },
			} )
		).toEqual( {
			layout: { columnStart: 2 },
			'@tablet': { layout: { columnStart: 1 } },
			'@mobile': { layout: undefined, spacing: { padding: 0 } },
		} );
	} );

	it( 'returns the same style when nothing is rotated', () => {
		const style = {
			layout: { columnStart: 2 },
			'@mobile': { layout: { columnStart: 1 } },
		};
		expect( removeRotation( style ) ).toBe( style );
	} );
} );
