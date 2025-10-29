/**
 * Internal dependencies
 */
import { lock } from '../../lock-unlock';

/**
 * Internal dependencies
 */
import postMetaBindings from '../post-meta';

describe( 'post-meta bindings', () => {
	describe( 'getValues', () => {
		describe( 'when no postId is provided in context', () => {
			let select, selectReturn;
			beforeAll( () => {
				const getEditedEntityRecord = ( kind, type, id ) => ( {
					meta: id
						? {
								movie_field: 'Test Movie Value',
						  }
						: {},
				} );

				selectReturn = {
					getEditedEntityRecord,
				};

				const getRegisteredPostMeta = () => ( {
					field_without_label_or_default: {},
					field_with_label_only: {
						title: 'Field With Label Only',
					},
					movie_field: {
						title: 'Movie Field Label',
						default: 'Movie field default value',
					},
				} );

				lock( selectReturn, { getRegisteredPostMeta } );

				select = () => selectReturn;
			} );

			it( 'should return the meta default value if it is defined', () => {
				const values = postMetaBindings.getValues( {
					select,
					context: { postType: 'movie' },
					bindings: {
						content: {
							args: { key: 'movie_field' },
						},
					},
				} );

				expect( values.content ).toBe( 'Movie field default value' );
			} );

			it( 'should fall back to the field label if the meta default value is not defined', () => {
				const values = postMetaBindings.getValues( {
					select,
					context: { postType: 'movie' },
					bindings: {
						content: {
							args: { key: 'field_with_label_only' },
						},
					},
				} );

				expect( values.content ).toBe( 'Field With Label Only' );
			} );

			it( 'should fall back to the field key if the field label is not defined', () => {
				const values = postMetaBindings.getValues( {
					select,
					context: { postType: 'movie' },
					bindings: {
						content: {
							args: { key: 'field_without_label_or_default' },
						},
					},
				} );

				expect( values.content ).toBe( 'field_without_label_or_default' );
			} );
		} );
	} );
} );
