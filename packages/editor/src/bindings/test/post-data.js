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
		describe( 'for regular blocks using context', () => {
			it( 'should return entity field values when they exist', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/post-date',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: () => ( {
							date: '2024-01-15',
							modified: '2024-01-20',
							link: 'https://example.com/post',
						} ),
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						content: { args: { field: 'date' } },
					},
					clientId: 'client-1',
				} );

				expect( values.content ).toBe( '2024-01-15' );
			} );

			it( 'should fall back to field label when entity value does not exist', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/post-date',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: () => ( {} ),
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						content: { args: { field: 'date' } },
					},
					clientId: 'client-1',
				} );

				expect( values.content ).toBe( 'Post Date' );
			} );

			it( 'should handle multiple bindings', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/post-date',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: () => ( {
							date: '2024-01-15',
							modified: '2024-01-20',
							link: 'https://example.com/post',
						} ),
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						date: { args: { field: 'date' } },
						modified: { args: { field: 'modified' } },
						link: { args: { field: 'link' } },
					},
					clientId: 'client-1',
				} );

				expect( values.date ).toBe( '2024-01-15' );
				expect( values.modified ).toBe( '2024-01-20' );
				expect( values.link ).toBe( 'https://example.com/post' );
			} );

			it( 'should return empty object for disallowed fields', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/post-date',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: () => ( {
							title: 'Post Title',
						} ),
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						content: { args: { field: 'title' } },
					},
					clientId: 'client-1',
				} );

				expect( values.content ).toEqual( {} );
			} );
		} );

		describe( 'for navigation blocks using block attributes', () => {
			it( 'should use block attributes instead of context for navigation-link', () => {
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
							// Verify it's called with block attributes, not context
							expect( id ).toBe( 456 );
							expect( type ).toBe( 'page' );
							return {
								date: '2024-02-01',
								link: 'https://example.com/page',
							};
						},
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 123, postType: 'post' },
					bindings: {
						url: { args: { field: 'link' } },
					},
					clientId: 'client-1',
				} );

				expect( values.url ).toBe( 'https://example.com/page' );
			} );

			it( 'should use block attributes instead of context for navigation-submenu', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-submenu',
							getBlockAttributes: () => ( {
								id: 789,
								type: 'page',
							} ),
						};
					}
					return {
						getEditedEntityRecord: ( _kind, type, id ) => {
							expect( id ).toBe( 789 );
							expect( type ).toBe( 'page' );
							return {
								link: 'https://example.com/submenu',
							};
						},
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 999, postType: 'post' },
					bindings: {
						url: { args: { field: 'link' } },
					},
					clientId: 'client-1',
				} );

				expect( values.url ).toBe( 'https://example.com/submenu' );
			} );
		} );
	} );

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
