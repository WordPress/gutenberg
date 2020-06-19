/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import ComboboxControl from '../../../../components/build/combobox-control';
import { useState, useEffect } from '@wordpress/element';
import apiRequest from '@wordpress/api-request';

/**
 * External dependencies
 */
import { debounce } from 'lodash';

function EnhancedPostAuthor( { postAuthor, id, authors, onUpdateAuthor } ) {
	// Wait until we have the post author before displaying the component.
	if ( 0 === postAuthor.length ) {
		return null;
	}
	const currentPostAuthor = postAuthor[ 0 ];
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
		( author ) => currentPostAuthor.id === author.id
	);
	if ( foundAuthor < 0 ) {
		initialAuthors = [ currentPostAuthor, ...initialAuthors ];
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
	const [ selectedAuthor, setSelectedAuthor ] = useState( currentPostAuthor );

	/**
	 * Handle author selection.
	 *
	 * @param {object} selectedItem The selected Author.
	 */
	const handleSelect = ( { selectedItem } ) => {
		setSelectedAuthor( selectedItem );
		onUpdateAuthor( selectedItem.id );
	};

	/**
	 * Handle user input.
	 *
	 * @param {object} param0 Contains a single property `inputValue` with the string value of the input field.
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
		apiRequest( { path: '/wp/v2/users' + payload } ).done( ( results ) => {
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
	}, 150 );

	return (
		<ComboboxControl
			id={ id }
			isLoadingSearchResults={ isLoadingSearchResults }
			options={ availableAuthors }
			initialHighlightedIndex={ foundAuthor }
			initialInputValue={ selectedAuthor.name }
			onInputValueChange={ handleKeydown }
			onChange={ handleSelect }
		/>
	);
}

export default EnhancedPostAuthor;
