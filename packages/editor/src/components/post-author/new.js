/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import ComboboxControl from '../../../../components/build/combobox-control/';
import { useState } from '@wordpress/element';
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

import { debounce } from 'lodash';

/* eslint-disable no-console */

function NewPostAuthor( { postAuthor, instanceId, authors } ) {
	console.log( 'postAuthor', postAuthor );
	if ( 0 === postAuthor.length ) {
		return null;
	}
	const currentPostAuthor = postAuthor[ 0 ];
	let mappedAuthors = [];
	authors.map( ( author, i ) => {
		mappedAuthors = [
			...mappedAuthors,
			{
				key: i,
				name: author.name,
				value: author.name,
				id: author.id,
			},
		];
	} );

	const [ isLoading, setIsLoading ] = useState( false );
	const foundAuthor = mappedAuthors.filter(
		( author ) => currentPostAuthor.id === author.id
	);
	if ( foundAuthor.length === 0 ) {
		mappedAuthors = [ ...mappedAuthors, currentPostAuthor ];
	}
	const [ filteredAuthors, setFilteredAuthors ] = useState( mappedAuthors );
	const [ selectedAuthor, setSelectedAuthor ] = useState( currentPostAuthor );
	const handleSelect = ( selectedItem, downshift ) => {
		setSelectedAuthor( selectedItem );
		downshift.reset();
	};

	const handleKeydown = ( {
		event,
		isOpen,
		selectHighlightedItem,
		inputValue,
	} ) => {
		console.log( 'handleKeydown', {
			event,
			isOpen,
			selectHighlightedItem,
			inputValue,
		} );
		suggestAuthor( inputValue );
	};

	const suggestAuthor = debounce( ( query, populateResults ) => {
		const payload = '?search=' + encodeURIComponent( query );
		setIsLoading( true );
		apiRequest( { path: '/wp/v2/users' + payload } ).done( ( results ) => {
			setFilteredAuthors(
				results.map( ( author, i ) => ( {
					key: i,
					name: author.name,
					value: author.name,
					id: author.id,
				} ) )
			);
			setIsLoading( false );
		} );
	}, 150 );

	const setAuthorId = ( event ) => {
		const { onUpdateAuthor } = this.props;
		const { value } = event.target;
		onUpdateAuthor( Number( value ) );
	};

	const selectId = 'post-author-selector-' + instanceId;
	console.log( selectedAuthor );

	return (
		<PostAuthorCheck>
			<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
			<ComboboxControl
				isLoading={ isLoading }
				options={ filteredAuthors }
				initialSelectedItem={ selectedAuthor.id }
				initialInputValue={ selectedAuthor.name }
				onInputValueChange={ ( {
					event,
					isOpen,
					selectHighlightedItem,
					inputValue,
				} ) => {
					handleKeydown( {
						event,
						isOpen,
						selectHighlightedItem,
						inputValue,
					} );
				} }
				onChange={ ( { selectedItem } ) => {
					console.log( 'onSelectedItemChange', selectedItem );
					setSelectedAuthor( selectedItem );
				} }
			/>
		</PostAuthorCheck>
	);
	/* eslint-enable jsx-a11y/no-onchange */
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthor: select( 'core' ).getAuthor(
				select( 'core/editor' ).getEditedPostAttribute( 'author' )
			),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
	withInstanceId,
] )( NewPostAuthor );
