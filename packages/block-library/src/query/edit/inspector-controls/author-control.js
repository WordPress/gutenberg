/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { FormTokenField } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { getEntitiesInfo } from '../../utils';

const AUTHORS_QUERY = {
	who: 'authors',
	per_page: -1,
	_fields: 'id,name',
	context: 'view',
};

function AuthorControl( { value, onChange } ) {
	const authorsList = useSelect( ( select ) => {
		const { getUsers } = select( coreStore );
		return getUsers( AUTHORS_QUERY );
	}, [] );

	if ( ! authorsList ) {
		return null;
	}
	const authorsInfo = getEntitiesInfo( authorsList );
	/**
	 * We need to normalize the value because the block operates on a
	 * comma(`,`) separated string value and `FormTokenFiels` needs an
	 * array.
	 */
	const normalizedValue = ! value ? [] : value.toString().split( ',' );
	// Returns only the existing authors ids. This prevents the component
	// from crashing in the editor, when non existing ids are provided.
	const sanitizedValue = normalizedValue.reduce(
		( accumulator, authorId ) => {
			const author = authorsInfo.mapById[ authorId ];
			if ( author ) {
				accumulator.push( {
					id: authorId,
					value: author.name,
				} );
			}
			return accumulator;
		},
		[]
	);

	const getIdByValue = ( entitiesMappedByName, authorValue ) => {
		const id = authorValue?.id || entitiesMappedByName[ authorValue ]?.id;
		if ( id ) return id;
	};
	const onAuthorChange = ( newValue ) => {
		const ids = Array.from(
			newValue.reduce( ( accumulator, author ) => {
				// Verify that new values point to existing entities.
				const id = getIdByValue( authorsInfo.mapByName, author );
				if ( id ) accumulator.add( id );
				return accumulator;
			}, new Set() )
		);
		onChange( { author: ids.join( ',' ) } );
	};
	return (
		<FormTokenField
			label={ __( 'Authors' ) }
			value={ sanitizedValue }
			suggestions={ authorsInfo.names }
			onChange={ onAuthorChange }
		/>
	);
}

export default AuthorControl;
