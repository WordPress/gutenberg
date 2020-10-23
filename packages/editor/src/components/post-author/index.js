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
import { withInstanceId, compose } from '@wordpress/compose';
import { decodeEntities } from '@wordpress/html-entities';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

const minimumUsersForCombobox = 20;

function PostAuthor( { instanceId } ) {
	const [ fieldValue, setFieldValue ] = useState();
	const [ isCombobox, setIsCombobox ] = useState( false );
	const { authorId, isLoading, authors, postAuthor } = useSelect(
		( select ) => {
			const { getUser, getUsers, isResolving } = select( 'core' );
			const { getEditedPostAttribute } = select( 'core/editor' );
			const author = getUser( getEditedPostAttribute( 'author' ) );
			const isSearching =
				isCombobox &&
				( postAuthor
					? fieldValue && postAuthor.name !== fieldValue
					: fieldValue );
			const query = isSearching
				? { search: fieldValue, per_page: 100 }
				: { per_page: 100 };
			return {
				authorId: getEditedPostAttribute( 'author' ),
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

	useEffect( () => {
		if ( authors ) {
			setIsCombobox( authors?.length >= minimumUsersForCombobox );
		}
	}, [] );

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
	 * @param {number|Object} selectedAuthor The selected Author.
	 */
	const handleSelect = ( selectedAuthor ) => {
		if ( ! selectedAuthor ) {
			return;
		}
		if ( isNaN( selectedAuthor ) ) {
			const { value } = selectedAuthor.target;
			editPost( { author: Number( value ) } );
		} else {
			editPost( { author: selectedAuthor } );
		}
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

	if ( ! isCombobox ) {
		const selectId = 'post-author-selector-' + instanceId;

		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<select
					id={ selectId }
					defaultValue={ postAuthor.id }
					onBlur={ handleSelect }
					className="editor-post-author__select"
				>
					{ authors &&
						authors.map( ( author ) => (
							<option key={ author.id } value={ author.id }>
								{ decodeEntities( author.name ) }
							</option>
						) ) }
				</select>
			</PostAuthorCheck>
		);
	}

	return (
		<PostAuthorCheck>
			<ComboboxControl
				label={ __( 'Author' ) }
				options={ authorOptions }
				value={ authorId }
				onFilterValueChange={ debounce( handleKeydown, 300 ) }
				onChange={ handleSelect }
				isLoading={ isLoading }
				allowReset={ false }
			/>
		</PostAuthorCheck>
	);
}

export default compose( [ withInstanceId ] )( PostAuthor );
