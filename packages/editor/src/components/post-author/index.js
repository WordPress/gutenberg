/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import ComboboxControl from '../../../../components/build/combobox-control/';
import PostAuthorCheck from './check';

function PostAuthor() {
	const authors = useSelect( ( select ) => select( 'core' ).getAuthors() );
	const postAuthor = useSelect( ( select ) =>
		select( 'core' ).getAuthor(
			select( 'core/editor' ).getEditedPostAttribute( 'author' )
		)
	);

	const dispatch = useDispatch();

	const authorsForField = useMemo( () => {
		return authors.map( ( author ) => {
			return {
				key: author.id,
				name: author.name,
				id: author.id,
			};
		} );
	}, [ authors ] );

	// Ensure the current author is included in the initial dropdown list.
	let foundAuthor = authorsForField.findIndex(
		( author ) => postAuthor?.id === author.id
	);

	// The currently field value.
	const [ fieldValue, setFieldValue ] = useState( postAuthor?.name );

	if ( authors?.length > 0 && foundAuthor < 0 && postAuthor ) {
		postAuthor.key = authorsForField.length;
		authors.unshift( postAuthor );
		foundAuthor = 0;
	}

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
		dispatch( 'core/editor' ).editPost( { author: selectedItem.id } );
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
			if (
				! fieldValue ||
				'' === fieldValue ||
				fieldValue === postAuthor?.name
			) {
				return select( 'core' )
					.getAuthors()
					.map( ( author ) => ( {
						key: author.id,
						name: author.name,
						id: author.id,
					} ) );
			}

			return select( 'core' )
				.getAuthors( { search: fieldValue } )
				.map( ( author ) => ( {
					key: author.id,
					name: author.name,
					id: author.id,
				} ) );
		},
		[ fieldValue, postAuthor ]
	);

	if ( ! postAuthor ) {
		return null;
	}

	const selectId = 'post-author-selector';

	return (
		<PostAuthorCheck>
			<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
			<ComboboxControl
				options={ availableAuthors }
				initialInputValue={ postAuthor?.name }
				onInputValueChange={ debounce( handleKeydown, 300 ) }
				onChange={ handleSelect }
				initialHighlightedIndex={ foundAuthor }
			/>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
