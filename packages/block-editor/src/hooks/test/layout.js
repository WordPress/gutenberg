/**
 * Internal dependencies
 */
import { getResetLayout } from '../layout';

describe( 'layout', () => {
	describe( 'getResetLayout()', () => {
		it( 'should reset to variation layout defaults', () => {
			const layout = getResetLayout(
				{ default: { type: 'flex' } },
				{
					attributes: {
						layout: {
							type: 'grid',
							columnCount: 3,
						},
					},
				}
			);

			expect( layout ).toEqual( {
				type: 'grid',
				columnCount: 3,
			} );
		} );

		it( 'should fall back to the block support layout defaults', () => {
			const layout = getResetLayout(
				{
					default: {
						type: 'flex',
						flexWrap: 'nowrap',
					},
				},
				undefined
			);

			expect( layout ).toEqual( {
				type: 'flex',
				flexWrap: 'nowrap',
			} );
		} );

		it( 'should return undefined when there is no layout config', () => {
			expect( getResetLayout() ).toBeUndefined();
		} );
	} );
} );
