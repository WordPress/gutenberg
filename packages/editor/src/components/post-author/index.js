/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo, useEffect } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, _x, sprintf } from '@wordpress/i18n';
import { FormTokenField } from '@wordpress/components';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

const MAX_AUTHORS_SUGGESTIONS = 20;

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
		const fetchedAuthors = ( authors ?? [] ).map(
			( author ) => `${ author.name } (${ author.id })`
		);

		// Ensure the current author is included in the dropdown list.
		const foundAuthor =
			authors &&
			authors.findIndex( ( { key } ) => postAuthor?.id === key );
		if ( foundAuthor < 0 && postAuthor ) {
			return [
				`${ postAuthor.name } (${ postAuthor.id })`,
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
	 * @param {Object} selectedItem The selected Author.
	 */
	const handleSelect = ( selectedItem ) => {
		if ( ! selectedItem ) {
			return;
		}
		const item = selectedItem[ 1 ];
		const matches = item.match( /(.*) \((.*)\)/ );
		const name = matches[ 1 ];
		const id = matches[ 2 ];

		setFieldValue( name );
		editPost( { author: id } );
	};

	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 * @param {Function} onBlur   The FormTokenField onBlur handler.
	 */
	const handleKeydown = ( inputValue, onBlur ) => {
		setFieldValue( inputValue );
		onBlur(); // Remove focus to show the token.
	};

	if ( ! postAuthor ) {
		return null;
	}

	const singularName = __( 'Author' );

	const authorAddedLabel = sprintf(
		/* translators: %s: author name. */
		_x( '%s added', 'author' ),
		singularName
	);
	const authorRemovedLabel = sprintf(
		/* translators: %s: author name. */
		_x( '%s removed', 'author' ),
		singularName
	);
	const removeAuthorLabel = sprintf(
		/* translators: %s: author name. */
		_x( 'Remove %s', 'author' ),
		singularName
	);

	return (
		<PostAuthorCheck>
			<FormTokenField
				className="components-form-author_selector"
				label={ __( 'Author' ) }
				suggestions={ authorOptions }
				value={ [ fieldValue || postAuthor?.name ] }
				onChange={ handleSelect }
				onInputChange={ debounce( handleKeydown, 300 ) }
				maxSuggestions={ MAX_AUTHORS_SUGGESTIONS }
				disabled={ isLoading }
				messages={ {
					added: authorAddedLabel,
					removed: authorRemovedLabel,
					remove: removeAuthorLabel,
				} }
			/>
		</PostAuthorCheck>
	);
}

export default PostAuthor;
