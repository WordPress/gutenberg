/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';

/**
 * Internal dependencies
 */
import ComboboxControl from '../../../../components/build/combobox-control/';

function EnhancedPostAuthor( { postAuthor, authors, onUpdateAuthor } ) {
	const initialAuthors = useMemo( () => {
		return authors.map( ( author ) => {
			return {
				key: author.id,
				name: author.name,
				id: author.id,
			};
		} );
	}, [ authors ] );

	// Ensure the current author is included in the initial dropdown list.
	let foundAuthor = initialAuthors.findIndex(
		( author ) => postAuthor?.id === author.id
	);

	if ( foundAuthor < 0 ) {
		postAuthor.key = initialAuthors.length;
		initialAuthors.unshift( postAuthor );
		foundAuthor = 0;
	}

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
		if ( ! selectedItem ) {
			return;
		}
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

	const availableAuthors = useSelect(
		( select ) => {
			if ( '' === fieldValue || fieldValue === selectedAuthor.name ) {
				return initialAuthors;
			}
			return select( 'core' )
				.searchAuthors( fieldValue )
				.map( ( author ) => ( {
					key: author.id,
					name: author.name,
					id: author.id,
				} ) );
		},
		[ fieldValue, selectedAuthor ]
	);

	return (
		<ComboboxControl
			options={ availableAuthors }
			initialHighlightedIndex={ foundAuthor }
			initialInputValue={ selectedAuthor?.name }
			onInputValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleSelect }
		/>
	);
}

export default EnhancedPostAuthor;
