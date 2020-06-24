/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import ComboboxControl from '../../../../components/build/combobox-control/';

function EnhancedPostAuthor( { postAuthor, id, authors, onUpdateAuthor } ) {
	let initialAuthors = [];
	authors.forEach( ( author, i ) => {
		initialAuthors = [
			...initialAuthors,
			{
				key: i,
				name: author.name,
				value: author.name,
				id: author.id,
			},
		];
	} );

	// Ensure the current author is included in the initial dropdown list.
	let foundAuthor = initialAuthors.findIndex(
		( author ) => currentPostAuthor?.id === author.id
	);

	if ( postAuthor && foundAuthor < 0 ) {
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

	/**
	 * Handle author selection.
	 *
	 * @param {Object} selectedItem The selected Author.
	 */
	const handleSelect = ( { selectedItem } ) => {
		setSelectedAuthor( selectedItem );
		onUpdateAuthor( selectedItem.id );
	};

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( { inputValue } ) => {
		if ( '' === inputValue ) {
			// When the field is cleared, reset the author list to the original list.
			setAvailableAuthors( initialAuthors );
		} else {
			// Otherwise search for authors matching the input.
			searchAuthors( inputValue );
		}
	};

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
				results.map( ( author, i ) => ( {
					key: i,
					name: author.name,
					value: author.name,
					id: author.id,
				} ) )
			);
			setIsLoadingSearchResult( false );
		} );
	}, 300 );

	return (
		<ComboboxControl
			id={ id }
			isLoading={ isLoadingSearchResults }
			options={ availableAuthors }
			initialHighlightedIndex={ foundAuthor }
			initialInputValue={ selectedAuthor.name }
			onInputValueChange={ handleKeydown }
			onChange={ handleSelect }
		/>
	);
}

export default EnhancedPostAuthor;
