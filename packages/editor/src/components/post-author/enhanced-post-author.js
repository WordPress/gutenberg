/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ComboboxControl from '../../../../components/build/combobox-control/';

function EnhancedPostAuthor( { postAuthor, id, authors, onUpdateAuthor } ) {

	let initialAuthors = useMemo( () => {
		return authors.map( ( author ) => {
			return {
				key: author.id,
				name: author.name,
				value: author.name,
				id: author.id,
			};
		} );
	}, [ authors ] )

	// Ensure the current author is included in the initial dropdown list.
	let foundAuthor = initialAuthors.findIndex(
		( author ) => postAuthor?.id === author.id
	);

	if ( foundAuthor < 0 ) {
		postAuthor.key = initialAuthors.length;
		initialAuthors = [ postAuthor, ...initialAuthors ];
		foundAuthor = 0;
	}

	// The search result loading state.
	const [ isLoadingSearchResults, setIsLoadingSearchResult ] = useState(
		false
	);

	// The list of authors available in the dropdown.
	const [ availableAuthors, setAvailableAuthors ] = useState(
		initialAuthors
	);

	// The currently selected author.
	const [ selectedAuthor, setSelectedAuthor ] = useState( postAuthor );

	// The currently field value.
	const [ fieldValue, setFieldValue ] = useState( postAuthor.name );

	/**
	 * Handle author selection.
	 *
	 * @param {Object} selectedItem The selected Author.
	 */
	const handleSelect = ( { selectedItem } ) => {
		setFieldValue( selectedItem.name );
		onUpdateAuthor( selectedItem.id );
		setSelectedAuthor( selectedItem );
	};

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( { inputValue } ) => {
		setFieldValue( inputValue );
	};

	// Refresh the user list when the field value changes or the selection is changed.
	useEffect( () => {
		// When the field is cleared or unchanged, use the original author list.
		if ( '' === fieldValue || fieldValue === selectedAuthor.name ) {
			setAvailableAuthors( initialAuthors );
		} else {
			searchAuthors( fieldValue );
		}
	}, [ fieldValue, selectedAuthor ] );

	/**
	 * Search for authors from the rest API.
	 *
	 * @param string query The string to search for.
	 **/
	const searchAuthors = debounce( ( query ) => {
		const payload = '?search=' + encodeURIComponent( query );
		setIsLoadingSearchResult( true );
		apiFetch( { path: '/wp/v2/users' + payload } ).then( ( results ) => {
			setAvailableAuthors(
				results.map( ( author ) => ( {
					key: author.id,
					name: author.name,
					value: author.name,
					id: author.id,
				} ) )
			);
			setIsLoadingSearchResult( false );
		} );
	},
	300 );

	return (
		<ComboboxControl
			id={ id }
			isLoading={ isLoadingSearchResults }
			options={ availableAuthors }
			initialHighlightedIndex={ foundAuthor }
			initialInputValue={ selectedAuthor?.name }
			onInputValueChange={ handleKeydown }
			onChange={ handleSelect }
		/>
	);
}

export default EnhancedPostAuthor;
