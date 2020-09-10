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

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

function PostAuthor() {
	const [ fieldValue, setFieldValue ] = useState();

	const { isLoading, authors, postAuthor } = useSelect(
		( select ) => {
			const { getUser, getUsers, isResolving } = select( 'core' );
			const { getEditedPostAttribute } = select( 'core/editor' );
			const author = getUser( getEditedPostAttribute( 'author' ) );
			const query =
				! fieldValue || '' === fieldValue || fieldValue === author?.name
					? {}
					: { search: fieldValue };
			return {
				postAuthor: author,
				authors: getUsers( { who: 'authors', ...query } ),
				isLoading: isResolving( 'core', 'getUsers', [
					{ search: fieldValue, who: 'authors' },
				] ),
			};
		},
		[ fieldValue ]
	);
	const { editPost } = useDispatch( 'core/editor' );

	const authorOptions = useMemo( () => {
		const fetchedAuthors = ( authors ?? [] ).map( ( author ) => {
			return {
				key: author.id,
				name: author.name,
			};
		} );

		// Ensure the current author is included in the dropdown list.
		const foundAuthor = fetchedAuthors.findIndex(
			( { key } ) => postAuthor?.id === key
		);
		if ( foundAuthor < 0 && postAuthor ) {
			return [
				{ key: postAuthor.id, name: postAuthor.name },
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
	 * @param {Object} value The selected Author.
	 * @param {Object} value.selectedItem The selected Author.
	 */
	const handleSelect = ( { selectedItem } ) => {
		if ( ! selectedItem ) {
			return;
		}
		setFieldValue( selectedItem.name );
		editPost( { author: selectedItem.key } );
	};

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( { inputValue } ) => {
		setFieldValue( inputValue );
	};

	if ( ! postAuthor ) {
		return null;
	}

	return (
		<PostAuthorCheck>
			<ComboboxControl
				label={ __( 'Author' ) }
				options={ authorOptions }
				initialInputValue={ postAuthor?.name }
				onInputValueChange={ debounce( handleKeydown, 300 ) }
				onChange={ handleSelect }
				initialSelectedItem={ {
					key: postAuthor.id,
					name: postAuthor.name,
				} }
				isLoading={ isLoading }
			/>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
