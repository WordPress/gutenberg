/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { withInstanceId } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import apiRequest from '@wordpress/api-request';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

/**
 * External dependencies
 */
import Downshift from 'downshift';
import { debounce } from 'underscore';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
		this.suggestAuthors = this.suggestAuthors.bind( this );
	}

	setAuthorId( selected ) {
		const { onUpdateAuthor } = this.props;
		const { id } = selected;
		onUpdateAuthor( Number( id ) );
	}

	suggestAuthors( query, populateResults ) {
		if ( query.length < 2 ) {
			return;
		}
		const payload = '?search=' + encodeURIComponent( query );
		apiRequest( { path: '/wp/v2/users' + payload } ).done( ( results ) => {
			this.setState( results.map( ( author ) => ( author.name ) ) );
		} );
 	}

	render() {
		const { postAuthor, instanceId, authors, author } = this.props;
		const selectId = 'post-author-selector-' + instanceId;
		const currentPostAuthor = author.length > 0 ? author[0].name : '';
		const allAuthors = this.state && this.state.authors ? this.state.authors : authors;

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			currentPostAuthor &&
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<Downshift
					onChange={this.setAuthorId}
					itemToString={author => (author ? author.value : '')}
					defaultInputValue={ currentPostAuthor }
					onInputValueChange={ debounce( this.suggestAuthors, 300 ) }
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
							? allAuthors
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
			author: select( 'core' ).getAuthor( select( 'core/editor' ).getEditedPostAttribute( 'author' ) ),
		};
	} ),
	withDispatch( ( dispatch ) => ( {
		onUpdateAuthor( author ) {
			dispatch( 'core/editor' ).editPost( { author } );
		},
	} ) ),
	withInstanceId,
] )( PostAuthor );
