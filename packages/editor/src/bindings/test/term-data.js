/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import termDataBindings from '../term-data';

describe( 'term-data bindings', () => {
	describe( 'getValues', () => {
		describe( 'for regular blocks using block context', () => {
			let select;
			beforeAll( () => {
				select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: ( clientId ) =>
								clientId === '123abc456'
									? 'core/paragraph'
									: undefined,
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEntityRecord: ( kind, name, recordId ) =>
							kind === 'taxonomy' &&
							name === 'category' &&
							recordId === 1
								? {
										id: 1,
										name: 'Uncategorized',
										slug: 'uncategorized',
										link: 'https://example.com/category/uncategorized',
										description: 'Default category',
										parent: 0,
										count: 5,
								  }
								: null,
					};
				};
			} );

			it( 'should return entity field values when they exist', () => {
				const values = termDataBindings.getValues( {
					select,
					context: { termId: 1, taxonomy: 'category' },
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
						url: {
							source: 'core/term-data',
							args: { field: 'link' },
						},
						title: {
							source: 'core/term-data',
							args: { field: 'description' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					content: 'Uncategorized',
					url: 'https://example.com/category/uncategorized',
					title: 'Default category',
				} );
			} );

			it( 'should fall back to field key when entity value does not exist', () => {
				const values = termDataBindings.getValues( {
					select,
					context: { termId: 999, taxonomy: 'category' },
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
						url: {
							source: 'core/term-data',
							args: { field: 'link' },
						},
						title: {
							source: 'core/term-data',
							args: { field: 'description' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					content: 'name',
					url: 'link',
					title: 'description',
				} );
			} );

			it( 'should fall back to field key when both value and label do not exist', () => {
				const values = termDataBindings.getValues( {
					select,
					context: { termId: 999, taxonomy: 'category' },
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'unknown_field' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.content ).toBe( 'unknown_field' );
			} );

			it( 'should handle all term data fields', () => {
				const values = termDataBindings.getValues( {
					select,
					context: { termId: 1, taxonomy: 'category' },
					bindings: {
						id: {
							source: 'core/term-data',
							args: { field: 'id' },
						},
						name: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
						slug: {
							source: 'core/term-data',
							args: { field: 'slug' },
						},
						link: {
							source: 'core/term-data',
							args: { field: 'link' },
						},
						description: {
							source: 'core/term-data',
							args: { field: 'description' },
						},
						parent: {
							source: 'core/term-data',
							args: { field: 'parent' },
						},
						count: {
							source: 'core/term-data',
							args: { field: 'count' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					id: 1,
					name: 'Uncategorized',
					slug: 'uncategorized',
					link: 'https://example.com/category/uncategorized',
					description: 'Default category',
					parent: 0,
					count: '(5)',
				} );
			} );

			it( 'should use context.termData as fallback when getEntityRecord returns null', () => {
				const selectWithTermData = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/paragraph',
							getBlockAttributes: () => ( {} ),
						};
					}
					return {
						getEntityRecord: () => null,
					};
				};

				const values = termDataBindings.getValues( {
					select: selectWithTermData,
					context: {
						termId: 1,
						taxonomy: 'category',
						termData: {
							name: 'Fallback Category',
							link: 'https://example.com/fallback',
						},
					},
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.content ).toBe( 'Fallback Category' );
			} );
		} );

		describe( 'for navigation blocks using block attributes', () => {
			it( 'should use block attributes instead of context for navigation-link', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( {
								id: 2,
								type: 'category',
							} ),
						};
					}
					return {
						getEntityRecord: ( kind, taxonomy, id ) => {
							if (
								kind !== 'taxonomy' ||
								taxonomy !== 'category' ||
								id !== 2
							) {
								return null;
							}
							return {
								id: 2,
								name: 'News',
								link: 'https://example.com/category/news',
							};
						},
					};
				};

				const values = termDataBindings.getValues( {
					select,
					context: { termId: 999, taxonomy: 'post_tag' },
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
						url: {
							source: 'core/term-data',
							args: { field: 'link' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					content: 'News',
					url: 'https://example.com/category/news',
				} );
			} );

			it( 'should use block attributes for navigation-submenu', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-submenu',
							getBlockAttributes: () => ( {
								id: 3,
								type: 'category',
							} ),
						};
					}
					return {
						getEntityRecord: ( kind, taxonomy, id ) => {
							if (
								kind !== 'taxonomy' ||
								taxonomy !== 'category' ||
								id !== 3
							) {
								return null;
							}
							return {
								id: 3,
								name: 'Sports',
								link: 'https://example.com/category/sports',
							};
						},
					};
				};

				const values = termDataBindings.getValues( {
					select,
					context: {},
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.content ).toBe( 'Sports' );
			} );

			it( 'should convert "tag" type to "post_tag" taxonomy', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( {
								id: 5,
								type: 'tag',
							} ),
						};
					}
					return {
						getEntityRecord: ( kind, taxonomy, id ) => {
							if (
								kind !== 'taxonomy' ||
								taxonomy !== 'post_tag' ||
								id !== 5
							) {
								return null;
							}
							return {
								id: 5,
								name: 'Featured',
								link: 'https://example.com/tag/featured',
							};
						},
					};
				};

				const values = termDataBindings.getValues( {
					select,
					context: {},
					bindings: {
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values.content ).toBe( 'Featured' );
			} );
		} );
	} );

	describe( 'canUserEditValue', () => {
		it( 'should return false for navigation block types', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/navigation-link',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 1, taxonomy: 'category' },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when termQuery is present', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 1, taxonomy: 'category', termQuery: {} },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when taxonomy is not defined', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 1 },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when termId is not defined', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category' },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when entity record is not found', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => null,
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 999, taxonomy: 'category' },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when field value is undefined', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 1, taxonomy: 'category' },
				args: { field: 'nonexistent_field' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false even when all conditions are met (terms are read-only)', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
					};
				}
				return {
					getEntityRecord: () => ( {
						name: 'Test Category',
					} ),
				};
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 1, taxonomy: 'category' },
				args: { field: 'name' },
			} );

			// Terms are always read-only, even with valid data
			expect( canEdit ).toBe( false );
		} );
	} );

	describe( 'getFieldsList', () => {
		it( 'should return the list of available term data fields when context has termId and taxonomy', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				return {
					getEntityRecord: () => ( {
						id: 1,
						name: 'Test',
						slug: 'test',
						link: 'https://example.com/test',
						description: 'Test description',
						parent: 0,
						count: 5,
					} ),
				};
			};

			const fields = termDataBindings.getFieldsList( {
				select,
				context: { termId: 1, taxonomy: 'category' },
			} );

			expect( fields ).toEqual( [
				{
					label: 'Term ID',
					type: 'string',
					args: { field: 'id' },
				},
				{
					label: 'Name',
					type: 'string',
					args: { field: 'name' },
				},
				{
					label: 'Slug',
					type: 'string',
					args: { field: 'slug' },
				},
				{
					label: 'Link',
					type: 'string',
					args: { field: 'link' },
				},
				{
					label: 'Description',
					type: 'string',
					args: { field: 'description' },
				},
				{
					label: 'Parent ID',
					type: 'string',
					args: { field: 'parent' },
				},
				{
					label: 'Count',
					type: 'string',
					args: { field: 'count' },
				},
			] );
		} );

		it( 'should return an empty array when taxonomy is not defined', () => {
			const select = () => ( {
				getEntityRecord: () => null,
			} );

			const fields = termDataBindings.getFieldsList( {
				select,
				context: { termId: 1 },
			} );

			expect( fields ).toEqual( [] );
		} );

		it( 'should return an empty array when termId is not defined', () => {
			const select = () => ( {
				getEntityRecord: () => null,
			} );

			const fields = termDataBindings.getFieldsList( {
				select,
				context: { taxonomy: 'category' },
			} );

			expect( fields ).toEqual( [] );
		} );

		it( 'should return an empty array when entity record is not found', () => {
			const select = () => ( {
				getEntityRecord: () => null,
			} );

			const fields = termDataBindings.getFieldsList( {
				select,
				context: { termId: 999, taxonomy: 'category' },
			} );

			expect( fields ).toEqual( [] );
		} );
	} );
} );
