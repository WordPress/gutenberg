/**
 * External dependencies
 */
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { useState, useMemo } from '@wordpress/element';
import { withSelect, withDispatch, useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { compose, withInstanceId } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

function PostAuthor( { authors, postAuthor, onUpdateAuthor } ) {
	const authorsForField = useMemo( () => {
		return authors.map( ( author ) => {
			return {
				key: author.id,
				name: author.name,
			};
		} );
	}, [ authors ] );

	// Ensure the current author is included in the initial dropdown list.
	let foundAuthor = authorsForField.findIndex(
		( author ) => postAuthor?.id === author.key
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
	 * @param {Object} value The selected Author.
	 * @param {Object} value.selectedItem The selected Author.
	 */
	const handleSelect = ( { selectedItem } ) => {
		if ( ! selectedItem ) {
			return;
		}
		setFieldValue( selectedItem.name );
		onUpdateAuthor( selectedItem.key );
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
					.getUsers( { who: 'authors' } )
					.map( ( author ) => ( {
						key: author.id,
						name: author.name,
					} ) );
			}

			return select( 'core' )
				.getUsers( { who: 'authors', search: fieldValue } )
				.map( ( author ) => ( {
					key: author.id,
					name: author.name,
				} ) );
		},
		[ fieldValue, postAuthor, isLoading ]
	);

	const isLoading = useSelect(
		( select ) => {
			return select( 'core/data' ).isResolving( 'core', 'getUsers', [
				{ search: fieldValue, who: 'authors' },
			] );
		},
		[ availableAuthors, fieldValue ]
	);

	if ( ! postAuthor ) {
		return null;
	}

	const selectId = 'post-author-selector';

	const postAuthorEntry = {
		key: postAuthor.id,
		name: postAuthor.name,
	};

	return (
		<PostAuthorCheck>
			<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
			<ComboboxControl
				options={ availableAuthors }
				initialInputValue={ postAuthor?.name }
				onInputValueChange={ debounce( handleKeydown, 300 ) }
				onChange={ handleSelect }
				initialSelectedItem={ postAuthorEntry }
				isLoading={ isLoading }
			/>
		</PostAuthorCheck>
	);
}

export default compose( [
	withSelect( ( select ) => {
		const { getUser, getUsers } = select( 'core' );
		const { getEditedPostAttribute } = select( 'core/editor' );
		return {
			authors: getUsers( { who: 'authors' } ),
			postAuthor: getUser( getEditedPostAttribute( 'author' ) ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
	withInstanceId,
] )( PostAuthor );
