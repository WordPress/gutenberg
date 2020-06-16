/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import ComboboxControl from '../../../../components/build/combobox-control/';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

/* eslint-disable no-console */
console.log( 'ComboboxControl', ComboboxControl );

function NewPostAuthor( { postAuthor, instanceId, authors } ) {
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
	/* eslint-disable no-console */

	const [ filteredAuthors, setFilteredAuthors ] = useState( mappedAuthors );
	const foundAuthor = filteredAuthors.filter(
		( author ) => postAuthor === author.id
	);
	const [ selectedAuthor, setSelectedAuthor ] = useState( foundAuthor[ 0 ] );
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
	};

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
				options={ filteredAuthors }
				initialSelectedItem={ selectedAuthor }
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
				onSelectedItemChange={ ( { selectedItem } ) => {
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
			postAuthor: select( 'core/editor' ).getEditedPostAttribute(
				'author'
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
