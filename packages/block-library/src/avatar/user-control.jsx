import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { useMemo, useState } from '@wordpress/element';
import { debounce } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

const AUTHORS_QUERY = {
	who: 'authors',
	per_page: 100,
	_fields: 'id,name',
	context: 'view',
};

export default function UserControl( { value, onChange } ) {
	const [ filterValue, setFilterValue ] = useState( '' );
	const { authors, selectedUser, isLoading } = useSelect(
		( select ) => {
			const { getUser, getUsers, isResolving } = select( coreStore );

			const query = { ...AUTHORS_QUERY };
			if ( filterValue ) {
				query.search = filterValue;
				query.search_columns = [ 'name' ];
			}

			return {
				authors: getUsers( query ),
				selectedUser: value
					? getUser( value, { context: 'view' } )
					: null,
				isLoading:
					isResolving( 'getUsers', [ query ] ) ||
					isResolving( 'getUser', [ value, { context: 'view' } ] ),
			};
		},
		[ filterValue, value ]
	);

	const options = useMemo( () => {
		const userOptions = ( authors ?? [] ).map( ( author ) => {
			return {
				value: author.id,
				label: decodeEntities( author.name ),
			};
		} );

		if (
			selectedUser &&
			! userOptions.some( ( option ) => option.value === selectedUser.id )
		) {
			userOptions.unshift( {
				value: selectedUser.id,
				label: decodeEntities( selectedUser.name ),
			} );
		}

		return userOptions;
	}, [ authors, selectedUser ] );

	return (
		<ComboboxControl
			label={ __( 'User' ) }
			help={ __(
				'Select the avatar user to display, if it is blank it will use the post/page author.'
			) }
			value={ value }
			onChange={ onChange }
			options={ options }
			onFilterValueChange={ debounce( setFilterValue, 300 ) }
			isLoading={ isLoading }
		/>
	);
}
