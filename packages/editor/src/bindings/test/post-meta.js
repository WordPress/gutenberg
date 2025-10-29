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
			it( 'should return the meta default value if it is defined', () => {
				const getEditedEntityRecord = ( kind, type, id ) => ( {
					meta: id
						? {
								movie_field: 'Test Movie Value',
						  }
						: {},
				} );

				const selectReturn = {
					getEditedEntityRecord,
				};

				const getRegisteredPostMeta = () => ( {
					movie_field: {
						label: 'Movie Field Label',
						default: 'Movie field default value',
					},
				} );

				lock( selectReturn, { getRegisteredPostMeta } );

				const values = postMetaBindings.getValues( {
					select: () => selectReturn,
					context: { postType: 'movie' },
					bindings: {
						content: {
							args: { key: 'movie_field' },
						},
					},
				} );

				expect( values.content ).toBe( 'Movie field default value' );
			} );
		} );
	} );
} );
