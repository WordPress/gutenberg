/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';

function PostAuthorCombobox() {
	const [ fieldValue, setFieldValue ] = useState();

	const { authorId, isLoading, authors, postAuthor } = useSelect(
		( select ) => {
			const { __unstableGetAuthor, getAuthors, isResolving } = select(
				coreStore
			);
			const { getEditedPostAttribute } = select( editorStore );
			const author = __unstableGetAuthor(
				getEditedPostAttribute( 'author' )
			);
			const query =
				! fieldValue || '' === fieldValue ? {} : { search: fieldValue };
			return {
				authorId: getEditedPostAttribute( 'author' ),
				postAuthor: author,
				authors: getAuthors( query ),
				isLoading: isResolving( 'core', 'getAuthors', [ query ] ),
			};
		},
		[ fieldValue ]
	);
	const { editPost } = useDispatch( editorStore );

	const authorOptions = useMemo( () => {
		const fetchedAuthors = ( authors ?? [] ).map( ( author ) => {
			return {
				value: author.id,
				label: author.name,
			};
		} );

		// Ensure the current author is included in the dropdown list.
		const foundAuthor = fetchedAuthors.findIndex(
			( { value } ) => postAuthor?.id === value
		);

		if ( foundAuthor < 0 && postAuthor ) {
			return [
				{ value: postAuthor.id, label: postAuthor.name },
				...fetchedAuthors,
			];
		}

		return fetchedAuthors;
	}, [ authors, postAuthor ] );

	// Initializes the post author properly
	// Also ensures external changes are reflected.
	useEffect( () => {
		if ( postAuthor ) {
			setFieldValue( postAuthor.name );
		}
	}, [ postAuthor ] );

	/**
	 * Handle author selection.
	 *
	 * @param {number} postAuthorId The selected Author.
	 */
	const handleSelect = ( postAuthorId ) => {
		if ( ! postAuthorId ) {
			return;
		}
		editPost( { author: postAuthorId } );
	};

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( inputValue ) => {
		setFieldValue( inputValue );
	};

	if ( ! postAuthor ) {
		return null;
	}

	return (
		<ComboboxControl
			label={ __( 'Author' ) }
			options={ authorOptions }
			value={ authorId }
			onFilterValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleSelect }
			isLoading={ isLoading }
			allowReset={ false }
		/>
	);
}

export default PostAuthorCombobox;
