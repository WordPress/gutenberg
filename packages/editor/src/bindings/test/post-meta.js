/**
 * Internal dependencies
 */
import { lock } from '../../lock-unlock';

/**
 * Internal dependencies
 */
import postMetaBindings from '../post-meta';

describe( 'post-meta bindings', () => {
	let context, select, selectReturn;

	beforeAll( () => {
		const getEditedEntityRecord = ( kind, type, id ) => ( {
			meta:
				id === 123
					? {
							movie_field: 'Test Movie Value',
					  }
					: {},
		} );

		const getEditorSettings = () => ( {
			enableCustomFields: false,
		} );

		selectReturn = {
			getEditedEntityRecord,
			getEditorSettings,
		};

		const getRegisteredPostMeta = () => ( {
			field_without_label_or_default: {},
			field_with_label_only: {
				title: 'Field With Label Only',
				default: '', // If there's no default set, getRegisteredPostMeta() will return an empty string.
			},
			movie_field: {
				title: 'Movie Field Label',
				default: 'Movie field default value',
			},
			_protected_field: {
				default: 'Protected field value',
			},
		} );

		lock( selectReturn, { getRegisteredPostMeta } );

		select = () => selectReturn;
	} );

	describe( 'when no postId is provided in context', () => {
		beforeAll( () => {
			context = { postType: 'movie' };
		} );

		describe( 'getValues', () => {
			it( 'should return the meta default value if it is defined', () => {
				const values = postMetaBindings.getValues( {
					select,
					context,
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
					context,
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
					context,
					bindings: {
						content: {
							args: { key: 'field_without_label_or_default' },
						},
					},
				} );

				expect( values.content ).toBe(
					'field_without_label_or_default'
				);
			} );
		} );
	} );

	describe( 'when postId is provided in context', () => {
		beforeAll( () => {
			context = { postType: 'movie', postId: 123 };
		} );

		describe( 'getValues', () => {
			it( 'should return the meta value if it is defined', () => {
				const values = postMetaBindings.getValues( {
					select,
					context,
					bindings: {
						content: {
							args: { key: 'movie_field' },
						},
					},
				} );

				expect( values.content ).toBe( 'Test Movie Value' );
			} );

			it( 'should fall back to the key when meta field is not accessible', () => {
				const values = postMetaBindings.getValues( {
					select,
					context,
					bindings: {
						content: {
							args: { key: 'inaccessible_field' },
						},
					},
				} );

				expect( values.content ).toBe( 'inaccessible_field' );
			} );
		} );

		describe( 'canUserEditValue', () => {
			beforeAll( () => {
				select = () => ( { ...selectReturn, canUser: () => true } );
			} );

			it( 'should return false when meta field is not accessible', () => {
				const canUser = postMetaBindings.canUserEditValue( {
					select,
					context,
					args: { key: 'inaccessible_field' },
				} );

				expect( canUser ).toBe( false );
			} );

			it( 'should return false when meta field is protected', () => {
				const canUser = postMetaBindings.canUserEditValue( {
					select,
					context,
					args: { key: '_protected_field' },
				} );

				expect( canUser ).toBe( false );
			} );
		} );
	} );
} );
