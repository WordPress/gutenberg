/**
 * Internal dependencies
 */
import { getResetLayout } from '../layout';

describe( 'layout', () => {
	describe( 'getResetLayout()', () => {
		it( 'should reset to variation layout defaults without resetting the current layout type', () => {
			const layout = getResetLayout(
				{ default: { type: 'flex' } },
				{
					attributes: {
						layout: {
							type: 'grid',
							columnCount: 3,
						},
					},
				},
				{ type: 'flex', columnCount: 6 }
			);

			expect( layout ).toEqual( {
				type: 'flex',
				columnCount: 3,
			} );
		} );

		it( 'should fall back to the block support layout defaults without resetting the current layout type', () => {
			const layout = getResetLayout(
				{
					default: {
						type: 'flex',
						flexWrap: 'nowrap',
					},
				},
				undefined,
				{ type: 'grid', flexWrap: 'wrap' }
			);

			expect( layout ).toEqual( {
				type: 'grid',
				flexWrap: 'nowrap',
			} );
		} );

		it( 'should preserve the current layout type when there is no layout config', () => {
			expect(
				getResetLayout( undefined, undefined, { type: 'flex' } )
			).toEqual( {
				type: 'flex',
			} );
		} );

		it( 'should return undefined when there is no layout config', () => {
			expect( getResetLayout() ).toBeUndefined();
		} );
	} );
} );
