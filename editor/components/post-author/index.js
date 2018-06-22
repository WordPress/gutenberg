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

	suggestAuthors( query ) {
		const payload = '?search=' + encodeURIComponent( query );
		this.setState( { searching: true } );
		apiRequest( { path: '/wp/v2/users' + payload } ).done( ( results ) => {
			this.setState( { searching: false } );
			this.setState( { authors: results.map( ( author ) => ( { id: author.id, name: author.name } ) ) } );
		} );
	}

	render() {
		const { instanceId, authors, postAuthor } = this.props;
		const selectId = 'post-author-selector-' + instanceId;
		const currentPostAuthor = postAuthor.length > 0 ? postAuthor[ 0 ].name : '';
		const allAuthors = this.state && this.state.authors ? this.state.authors : authors;
		const isSearching = this.state && this.state.searching;

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			currentPostAuthor && allAuthors &&
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<Downshift
					onChange={ this.setAuthorId }
					itemToString={ ( author ) => ( author ? author.value : '' ) }
					defaultInputValue={ currentPostAuthor }
					onInputValueChange={ debounce( this.suggestAuthors, 300 ) }
				>
					{ ( {
						getInputProps,
						getItemProps,
						getMenuProps,
						isOpen,
						inputValue,
						highlightedIndex,
						selectedItem,
					} ) => (
						<div>

							<div>
								<input id={ selectId } { ...getInputProps() } />
								<span
									className={ 'spinner' + ( isSearching ? ' is-active' : '' ) }
									style={ { position: 'absolute', right: '10px' } }
								/>
							</div>
							<ul className="editor-post-author__select" { ...getMenuProps() } >
								{ isOpen ?
									allAuthors
										.map( ( author ) => ( { id: author.id, value: author.name } ) )
										.filter( ( author ) =>
											! inputValue ||
											author.value.toLowerCase().includes( inputValue.toLowerCase() ) )
										.map( ( author, index ) => (
											<li
												key={ author.id }
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
												{ author.value }
											</li>
										) ) :
									null }
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
			postAuthor: select( 'core' ).getAuthor( select( 'core/editor' ).getEditedPostAttribute( 'author' ) ),
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
