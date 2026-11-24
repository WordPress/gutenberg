import { beforeAll, describe, expect, it } from 'vitest';
import { store as blockEditorStore } from '@wordpress/block-editor';
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

describe( 'post-data values for copying', () => {
	function createSelect( entityData, blockName = 'core/post-date' ) {
		return ( store ) =>
			store === blockEditorStore
				? {
						getBlockName: () => blockName,
						getSelectedBlockClientId: () => 'block-1',
						getBlockAttributes: () => ( { id: 456, type: 'page' } ),
					}
				: {
						getEditedEntityRecord: () => entityData,
						canUser: () => false,
					};
	}

	it( 'omits an unknown field key even when the entity contains that property', () => {
		const options = {
			select: createSelect( { unknown: 'Not a supported field' } ),
			context: { postId: 123, postType: 'post' },
			clientId: 'block-1',
			bindings: { content: { args: { field: 'unknown' } } },
		};

		expect( postDataBindings.getValues( options ) ).toEqual( {
			content: 'unknown',
		} );
		expect(
			postDataBindings.getValues( { ...options, isForCopy: true } )
		).toEqual( {} );
	} );

	it( 'omits the display label when the entity is unavailable', () => {
		const options = {
			select: createSelect( undefined ),
			context: { postId: 123, postType: 'post' },
			clientId: 'block-1',
			bindings: { content: { args: { field: 'date' } } },
		};

		expect( postDataBindings.getValues( options ) ).toEqual( {
			content: 'Post Date',
		} );
		expect(
			postDataBindings.getValues( { ...options, isForCopy: true } )
		).toEqual( {} );
	} );

	it.each( [ 'date', 'Post Date', '', 0, false, null ] )(
		'copies the genuine read-only entity value %s',
		( value ) => {
			const options = {
				select: createSelect( { date: value } ),
				context: { postId: 123, postType: 'post' },
				clientId: 'block-1',
				bindings: { content: { args: { field: 'date' } } },
			};

			expect( postDataBindings.canUserEditValue( options ) ).toBe(
				false
			);
			expect( postDataBindings.getValues( options ) ).toEqual( {
				content: value,
			} );
			expect(
				postDataBindings.getValues( { ...options, isForCopy: true } )
			).toEqual( { content: value } );
		}
	);

	it( 'omits only unavailable attributes in a batched copy request', () => {
		expect(
			postDataBindings.getValues( {
				select: createSelect( { date: '2026-11-24 07:00:00' } ),
				context: { postId: 123, postType: 'post' },
				clientId: 'block-1',
				bindings: {
					content: { args: { field: 'date' } },
					title: { args: { field: 'unknown' } },
					url: { args: { field: 'link' } },
				},
				isForCopy: true,
			} )
		).toEqual( { content: '2026-11-24 07:00:00' } );
	} );

	it( 'copies a read-only navigation link from its own entity', () => {
		const select = ( store ) =>
			store === blockEditorStore
				? {
						getBlockName: () => 'core/navigation-link',
						getBlockAttributes: () => ( { id: 456, type: 'page' } ),
					}
				: {
						getEditedEntityRecord: ( _, type, id ) =>
							type === 'page' && id === 456
								? { link: 'https://example.com/page' }
								: undefined,
					};

		expect(
			postDataBindings.getValues( {
				select,
				context: { postId: 123, postType: 'post' },
				clientId: 'block-1',
				bindings: { url: { args: { field: 'link' } } },
				isForCopy: true,
			} )
		).toEqual( { url: 'https://example.com/page' } );
	} );
} );
