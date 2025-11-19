/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import postDataBindings from '../post-data';

describe( 'post-data bindings', () => {
	describe( 'getValues', () => {
		describe( 'for regular blocks using block context', () => {
			let select;
			beforeAll( () => {
				select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: ( clientId ) =>
								clientId === '123abc456'
									? 'core/post-date'
									: undefined,
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: ( kind, name, recordId ) =>
							name === 'post' && recordId === 123
								? {
										date: '2024-03-02 00:00:00',
										modified: '2025-06-07 00:00:00',
										link: 'https://example.com/post',
										unknown: 'Unknown field value',
								  }
								: false,
					};
				};
			} );

			it( 'should return entity field values when they exist, and to field name for unknown fields', () => {
				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						datetime: {
							source: 'core/post-date',
							args: { field: 'date' },
						},
						modified: {
							source: 'core/post-date',
							args: { field: 'modified' },
						},
						url: {
							source: 'core/post-date',
							args: { field: 'link' },
						},
						content: {
							source: 'core/post-date',
							args: { field: 'unknown' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					datetime: '2024-03-02 00:00:00',
					modified: '2025-06-07 00:00:00',
					url: 'https://example.com/post',
					content: 'unknown',
				} );
			} );

			it( 'should fall back to field labels when entity value does not exist, and to field name for unknown fields', () => {
				const values = postDataBindings.getValues( {
					select,
					context: { postId: 456, postType: 'post' },
					bindings: {
						datetime: {
							source: 'core/post-date',
							args: { field: 'date' },
						},
						modified: {
							source: 'core/post-date',
							args: { field: 'modified' },
						},
						url: {
							source: 'core/post-date',
							args: { field: 'link' },
						},
						content: {
							source: 'core/post-date',
							args: { field: 'unknown' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					datetime: 'Post Date',
					modified: 'Post Modified Date',
					url: 'Post Link',
					content: 'unknown',
				} );
			} );
		} );

		describe( 'for navigation blocks using block attributes', () => {
			it( 'should use block attributes instead of context', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( {
								id: 456,
								type: 'page',
							} ),
						};
					}
					return {
						getEditedEntityRecord: ( _kind, type, id ) => {
							if ( type !== 'page' || id !== 456 ) {
								return {};
							}
							return {
								link: 'https://example.com/page',
							};
						},
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						url: {
							source: 'core/post-date',
							args: { field: 'link' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.url ).toBe( 'https://example.com/page' );
			} );
		} );
	} );

	describe( 'getFieldsList', () => {
		it( 'should return the list of available post data fields when a Navigation block with id and type attributes is selected', () => {
			const select = () => ( {
				getSelectedBlockClientId: () => '123abc456',
				getBlockName: () => 'core/navigation-link',
				getBlockAttributes: () => ( {
					id: 123,
					type: 'post',
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

		it( 'should return the list of available post data fields when a non-Navigation block is selected, and postId and postType context is provided', () => {
			const select = () => ( {
				getSelectedBlockClientId: () => '123abc456',
				getBlockName: () => 'core/post-date',
			} );

			const fields = postDataBindings.getFieldsList( {
				context: { postId: 123, postType: 'post' },
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

		it( 'should return an empty array when a Navigation block is selected but no post id attribute is provided', () => {
			const select = () => ( {
				getSelectedBlockClientId: () => '123abc456',
				getBlockName: () => 'core/navigation-link',
				getBlockAttributes: () => ( {
					type: 'post',
				} ),
			} );

			const fields = postDataBindings.getFieldsList( {
				select,
			} );

			expect( fields ).toEqual( [] );
		} );

		it( 'should return an empty array when a non-Navigation block is selected but no postId context is provided', () => {
			const select = () => ( {
				getSelectedBlockClientId: () => '123abc456',
				getBlockName: () => 'core/paragraph',
			} );

			const fields = postDataBindings.getFieldsList( {
				context: { postType: 'post' },
				select,
			} );

			expect( fields ).toEqual( [] );
		} );
	} );
} );
