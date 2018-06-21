/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

/**
 * External dependencies
 */
import Downshift from 'downshift'

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
	}

	setAuthorId( selected ) {
		console.log( selected );
		const { onUpdateAuthor } = this.props;
		const { id } = selected;
		onUpdateAuthor( Number( id ) );
	}

	render() {
		const { postAuthor, instanceId, authors } = this.props;
		const selectId = 'post-author-selector-' + instanceId;

		const authorName = authors
			.filter( author => author.id === postAuthor )[0]
			.name

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<Downshift
					onChange={this.setAuthorId}
					itemToString={author => (author ? author.value : '')}
					defaultInputValue={ authorName }
				>
					{({
						getInputProps,
						getItemProps,
						getLabelProps,
						getMenuProps,
						isOpen,
						inputValue,
						highlightedIndex,
						selectedItem,
					}) => (
						<div>
						<input id={ selectId } {...getInputProps()} />
						<ul className="editor-post-author__select" {...getMenuProps()}>
							{isOpen
							? authors
								.map( author => ( { id: author.id, value: author.name} ) )
								.filter( author =>
									! inputValue ||
									author.value.toLowerCase().includes(inputValue.toLowerCase() ) )
								.map( ( author, index) => (
									<li
									{ ...getItemProps( {
										key: author.id,
										index,
										item: author,
										style: {
										backgroundColor:
											highlightedIndex === index ? 'lightgray' : 'white',
										fontWeight: selectedItem === author ? 'bold' : 'normal',
										},
									} ) }
									>
									{author.value}
									</li>
								))
							: null}
						</ul>
						</div>
					) }
				</Downshift>
			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthor: select( 'core/editor' ).getEditedPostAttribute( 'author' ),
			authors: select( 'core' ).getAuthors(),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
	withInstanceId,
] )( PostAuthor );
