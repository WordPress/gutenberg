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
								: {},
					};
				};
			} );

			it( 'should return entity field values when they exist', () => {
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
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					datetime: '2024-03-02 00:00:00',
					modified: '2025-06-07 00:00:00',
					url: 'https://example.com/post',
				} );
			} );

			it( 'should fall back to field labels when entity value does not exist', () => {
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
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					datetime: 'Post Date',
					modified: 'Post Modified Date',
					url: 'Post Link',
				} );
			} );

			it( 'should return empty object for unknown fields', () => {
				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						content: {
							source: 'core/post-date',
							args: { field: 'unknown' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.content ).toEqual( {} );
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
		it( 'should return the list of available post data fields when the Date block is selected', () => {
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

		it( 'should return an empty array when any other block than the Date block is selected', () => {
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
