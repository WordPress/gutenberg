/**
 * Internal dependencies
 */
import postDataBindings from '../post-data';

describe( 'post-data bindings', () => {
	describe( 'getFieldsList', () => {
		it( 'should return the list of available post data fields when selected block is core/post-date', () => {
			const select = () => ( {
				getSelectedBlock: () => ( {
					name: 'core/post-date',
				} ),
			} );

			const fields = postDataBindings.getFieldsList( {
				select,
			} );

			expect( fields ).toEqual( [
				{
					label: 'Post Date',
					args: { field: 'date' },
					type: 'string',
				},
				{
					label: 'Post Modified Date',
					args: { field: 'modified' },
					type: 'string',
				},
				{
					label: 'Post Link',
					args: { field: 'link' },
					type: 'string',
				},
			] );
		} );

		it( 'should return an empty array when selected block is not core/post-date', () => {
			const select = () => ( {
				getSelectedBlock: () => ( {
					name: 'core/paragraph',
				} ),
			} );

			const fields = postDataBindings.getFieldsList( {
				select,
			} );

			expect( fields ).toEqual( [] );
		} );
	} );
} );
