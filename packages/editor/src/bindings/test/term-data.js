/**
 * WordPress dependencies
 */
import { store as blockEditorStore } from '@wordpress/block-editor';
import { store as coreDataStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { default as termDataBindings, termDataFields } from '../term-data';

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
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'category' &&
									termId === 123
								) {
									return {
										id: 123,
										name: 'Technology',
										slug: 'technology',
										link: 'https://example.com/category/technology',
										description: 'All about technology',
										parent: 0,
										count: 42,
									};
								}
								return undefined;
							},
						};
					}
				};
			} );

			it( 'should return entity field values when they exist, and field name for unknown fields', () => {
				const values = termDataBindings.getValues( {
					select,
					context: {
						taxonomy: 'category',
						termId: 123,
					},
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
						content: {
							source: 'core/term-data',
							args: { field: 'unknown' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					id: 123,
					name: 'Technology',
					slug: 'technology',
					link: 'https://example.com/category/technology',
					description: 'All about technology',
					parent: 0,
					count: '(42)',
					content: 'unknown',
				} );
			} );

			it( 'should fall back to field label when entity does not exist, and to field name for unknown fields', () => {
				const values = termDataBindings.getValues( {
					select,
					context: {
						taxonomy: 'category',
						termId: 456,
					},
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
						content: {
							source: 'core/term-data',
							args: { field: 'unknown' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					id: 'Term ID',
					name: 'Name',
					slug: 'Slug',
					link: 'Link',
					description: 'Description',
					parent: 'Parent ID',
					count: 'Count',
					content: 'unknown',
				} );
			} );
		} );

		describe( 'when termData is provided in context', () => {
			let select;
			beforeAll( () => {
				select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/paragraph',
							getBlockAttributes: () => ( {} ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: () => null,
						};
					}
				};
			} );

			it( 'should use termData from context when entity record is not available', () => {
				const values = termDataBindings.getValues( {
					select,
					context: {
						taxonomy: 'category',
						termId: 123,
						termData: {
							term_id: 123,
							name: 'Design',
							slug: 'design',
							link: 'https://example.com/category/design',
							description: 'Design resources',
							parent: 0,
							count: 15,
						},
					},
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
					content: 'Design',
					url: 'https://example.com/category/design',
				} );
			} );

			it( 'should use termData when taxonomy and termId are not provided', () => {
				const values = termDataBindings.getValues( {
					select,
					context: {
						termData: {
							term_id: 789,
							name: 'News',
							slug: 'news',
							link: 'https://example.com/category/news',
						},
					},
					bindings: {
						id: {
							source: 'core/term-data',
							args: { field: 'id' },
						},
						content: {
							source: 'core/term-data',
							args: { field: 'name' },
						},
					},
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					id: 789,
					content: 'News',
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
								type: 'category',
							} ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'category' &&
									termId === 456
								) {
									return {
										id: 456,
										name: 'Programming',
										link: 'https://example.com/category/programming',
									};
								}
								return null;
							},
						};
					}
				};

				const values = termDataBindings.getValues( {
					select,
					context: {},
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
					content: 'Programming',
					url: 'https://example.com/category/programming',
				} );
			} );

			it( 'should convert "tag" type to "post_tag" taxonomy', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( {
								id: 321,
								type: 'tag',
							} ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'post_tag' &&
									termId === 321
								) {
									return {
										name: 'JavaScript',
									};
								}
								return null;
							},
						};
					}
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

				expect( values.content ).toBe( 'JavaScript' );
			} );
		} );
	} );

	describe( 'setValues', () => {
		it( 'should return false as terms are not editable', () => {
			const result = termDataBindings.setValues( {
				dispatch: jest.fn(),
				context: { taxonomy: 'category', termId: 123 },
				bindings: {
					content: {
						args: { field: 'name' },
					},
				},
			} );

			expect( result ).toBe( false );
		} );
	} );

	describe( 'canUserEditValue', () => {
		let select;

		it( 'should return false for navigation-link blocks', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/navigation-link',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => ( {
							name: 'Test Category',
						} ),
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category', termId: 123 },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false for navigation-submenu blocks', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/navigation-submenu',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => ( {
							name: 'Test Category',
						} ),
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category', termId: 123 },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when termQuery is present in context', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/paragraph',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => ( {
							name: 'Test Category',
						} ),
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: {
					taxonomy: 'category',
					termId: 123,
					termQuery: { per_page: 10 },
				},
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when taxonomy is not defined', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/paragraph',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => null,
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { termId: 123 },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when termId is not defined', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/paragraph',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => null,
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category' },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false when field value is undefined', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/paragraph',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => null,
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category', termId: 123 },
				args: { field: 'unknown_field' },
			} );

			expect( canEdit ).toBe( false );
		} );

		it( 'should return false even when field value exists', () => {
			select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getBlockName: () => 'core/paragraph',
						getSelectedBlockClientId: () => '123abc456',
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: () => ( {
							name: 'Test Category',
							slug: 'test-category',
						} ),
					};
				}
			};

			const canEdit = termDataBindings.canUserEditValue( {
				select,
				context: { taxonomy: 'category', termId: 123 },
				args: { field: 'name' },
			} );

			expect( canEdit ).toBe( false );
		} );
	} );

	describe( 'getFieldsList', () => {
		describe( 'when a Navigation block is selected', () => {
			it( 'should return the list of available term data fields if id and type attributes are present', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getSelectedBlockClientId: () => '123abc456',
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( {
								id: 123,
								type: 'category',
							} ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'category' &&
									termId === 123
								) {
									return {
										id: 123,
										name: 'Technology',
										slug: 'technology',
										link: 'https://example.com/category/technology',
										description: 'All about technology',
										parent: 0,
										count: 42,
									};
								}
								return null;
							},
						};
					}
				};
				const fields = termDataBindings.getFieldsList( { select } );

				expect( fields ).toEqual( termDataFields );
			} );

			it( 'should return an empty array if id or type attributes are missing', () => {
				const select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getSelectedBlockClientId: () => '123abc456',
							getBlockName: () => 'core/navigation-link',
							getBlockAttributes: () => ( { type: 'category' } ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'category' &&
									termId === 123
								) {
									return {
										id: 123,
										name: 'Technology',
										slug: 'technology',
										link: 'https://example.com/category/technology',
										description: 'All about technology',
										parent: 0,
										count: 42,
									};
								}
								return null;
							},
						};
					}
				};
				const fields = termDataBindings.getFieldsList( { select } );

				expect( fields ).toEqual( [] );
			} );
		} );

		describe( 'when a non-Navigation block is selected', () => {
			let select;
			beforeAll( () => {
				select = ( store ) => {
					if ( store === blockEditorStore ) {
						return {
							getSelectedBlockClientId: () => '123abc456',
							getBlockName: () => 'core/paragraph',
							getBlockAttributes: () => ( {} ),
						};
					}
					if ( store === coreDataStore ) {
						return {
							getEntityRecord: ( kind, taxonomy, termId ) => {
								if (
									kind === 'taxonomy' &&
									taxonomy === 'category' &&
									termId === 123
								) {
									return {
										id: 123,
										name: 'Technology',
										slug: 'technology',
										link: 'https://example.com/category/technology',
										description: 'All about technology',
										parent: 0,
										count: 42,
									};
								}
								return null;
							},
						};
					}
				};
			} );

			it( 'should return the list of available term data fields when taxonomy and termId are provided by context', () => {
				const fields = termDataBindings.getFieldsList( {
					select,
					context: { taxonomy: 'category', termId: 123 },
				} );

				expect( fields ).toEqual( termDataFields );
			} );

			it( 'should return empty array when neither termId nor termData is provided from context', () => {
				const fields = termDataBindings.getFieldsList( {
					select,
					context: { taxonomy: 'category' },
				} );

				expect( fields ).toEqual( [] );
			} );

			it( 'should return fields when using termData from context', () => {
				const fields = termDataBindings.getFieldsList( {
					select,
					context: {
						termData: {
							term_id: 456,
							name: 'Design',
							slug: 'design',
							link: 'https://example.com/category/design',
							description: 'Design resources',
							parent: 0,
							count: 15,
						},
					},
				} );

				expect( fields ).toEqual( termDataFields );
			} );
		} );
	} );
} );
