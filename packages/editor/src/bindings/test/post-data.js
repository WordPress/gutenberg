/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreDataStore } from '@wordpress/core-data';

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

			it( 'should return entity field values when they exist, and field name for unknown fields', () => {
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

		describe( 'for blocks using binding args (e.g. core/button)', () => {
			it( 'should resolve from args.id and args.postType instead of context', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/button',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEditedEntityRecord: ( kind, type, id ) => {
							if (
								kind === 'postType' &&
								type === 'page' &&
								id === 42
							) {
								return {
									link: 'https://example.com/about',
								};
							}
							return undefined;
						},
					};
				};

				const values = postDataBindings.getValues( {
					select,
					context: { postId: 1, postType: 'post' },
					bindings: {
						url: {
							source: 'core/post-data',
							args: {
								field: 'link',
								id: 42,
								postType: 'page',
							},
						},
					},
					clientId: 'button-client',
				} );

				expect( values.url ).toBe( 'https://example.com/about' );
			} );
		} );
	} );

	describe( 'canUserEditValue', () => {
		it( 'returns false when binding args pin a post via id', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => 'client1',
						getBlockName: () => 'core/button',
					};
				}
				return {};
			};

			expect(
				postDataBindings.canUserEditValue( {
					select,
					context: { postId: 1, postType: 'post' },
					args: { id: 99, postType: 'page', field: 'link' },
				} )
			).toBe( false );
		} );

		it( 'returns true when context allows editing and args do not pin an entity', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => 'client1',
						getBlockName: () => 'core/paragraph',
					};
				}
				if ( store === coreDataStore ) {
					return {
						canUser: () => true,
					};
				}
				return {};
			};

			expect(
				postDataBindings.canUserEditValue( {
					select,
					context: { postId: 1, postType: 'post' },
					args: { field: 'date' },
				} )
			).toBe( true );
		} );
	} );

	describe( 'getFieldsList', () => {
		it( 'should return the list of available post data fields when the Date block is selected, and postId and postType are provided via context', () => {
			const select = () => ( {
				getSelectedBlock: () => ( {
					name: 'core/post-date',
				} ),
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

		it( 'should return an empty array when the Date block is selected but no postId context is provided', () => {
			const select = () => ( {
				getSelectedBlock: () => ( {
					name: 'core/post-date',
				} ),
			} );

			const fields = postDataBindings.getFieldsList( {
				context: { postType: 'post' },
				select,
			} );

			expect( fields ).toEqual( [] );
		} );

		it( 'should return an empty array when any other block than the Date block is selected', () => {
			const select = () => ( {
				getSelectedBlock: () => ( {
					name: 'core/paragraph',
				} ),
			} );

			const fields = postDataBindings.getFieldsList( {
				context: { postId: 123, postType: 'post' },
				select,
			} );

			expect( fields ).toEqual( [] );
		} );
	} );
} );
