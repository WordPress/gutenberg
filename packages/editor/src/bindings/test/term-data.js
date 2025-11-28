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
	const bindings = {
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
	};

	const getEntityRecordMock = ( kind, taxonomy, termId ) => {
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
				parent: 0,
				count: 42,
			};
		}
		return undefined;
	};

	describe( 'getValues', () => {
		describe( 'for regular blocks using block context', () => {
			describe( 'when termId and taxonomy are provided in context', () => {
				const select = ( store ) => {
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
							getEntityRecord: getEntityRecordMock,
						};
					}
				};

				it( 'should return entity field values when they exist, fall back to field label, and to field name for unknown fields', () => {
					const values = termDataBindings.getValues( {
						select,
						context: {
							taxonomy: 'category',
							termId: 123,
						},
						bindings,
						clientId: '123abc456',
					} );

					expect( values ).toStrictEqual( {
						id: 123,
						name: 'Technology',
						slug: 'technology',
						link: 'https://example.com/category/technology',
						description: 'Description',
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
						bindings,
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
				const select = ( store ) => {
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

				const termData = {
					id: 456,
					name: 'Design',
					link: 'https://example.com/category/design',
					description: 'Design resources',
					parent: 0,
					count: 15,
				};

				it( 'should use termData from context when entity record is not available', () => {
					const values = termDataBindings.getValues( {
						select,
						context: {
							taxonomy: 'category',
							termId: 456,
							termData,
						},
						bindings,
						clientId: '123abc456',
					} );

					expect( values ).toStrictEqual( {
						id: 456,
						name: 'Design',
						slug: 'Slug',
						link: 'https://example.com/category/design',
						description: 'Design resources',
						parent: 0,
						count: '(15)',
						content: 'unknown',
					} );
				} );

				it( 'should use termData when taxonomy and termId are not provided', () => {
					const values = termDataBindings.getValues( {
						select,
						context: {
							termData,
						},
						bindings,
						clientId: '123abc456',
					} );

					expect( values ).toStrictEqual( {
						id: 456,
						name: 'Design',
						slug: 'Slug',
						link: 'https://example.com/category/design',
						description: 'Design resources',
						parent: 0,
						count: '(15)',
						content: 'unknown',
					} );
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
								id: 789,
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
									termId === 789
								) {
									return {
										id: 789,
										name: 'Programming',
										slug: 'programming',
										link: 'https://example.com/category/programming',
										description: 'Programming resources',
										parent: 0,
										count: 10,
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
					bindings,
					clientId: '123abc456',
				} );

				expect( values ).toStrictEqual( {
					id: 789,
					name: 'Programming',
					slug: 'programming',
					link: 'https://example.com/category/programming',
					description: 'Programming resources',
					parent: 0,
					count: '(10)',
					content: 'unknown',
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
							getEntityRecord: getEntityRecordMock,
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
							getEntityRecord: getEntityRecordMock,
						};
					}
				};
				const fields = termDataBindings.getFieldsList( { select } );

				expect( fields ).toEqual( [] );
			} );
		} );

		describe( 'when a non-Navigation block is selected', () => {
			const select = ( store ) => {
				if ( store === blockEditorStore ) {
					return {
						getSelectedBlockClientId: () => '123abc456',
						getBlockName: () => 'core/paragraph',
						getBlockAttributes: () => ( {} ),
					};
				}
				if ( store === coreDataStore ) {
					return {
						getEntityRecord: getEntityRecordMock,
					};
				}
			};

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
							id: 456,
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
