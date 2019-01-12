/**
 * WordPress dependencies
 */
import { sprintf, __, _n } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

/**
 * External dependencies
 */
import Autocomplete from 'accessible-autocomplete/react';

import { debounce } from 'lodash';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
		this.suggestAuthor = this.suggestAuthor.bind( this );
		this.getCurrentAuthor = this.getCurrentAuthor.bind( this );
		this.resolveResults = this.resolveResults.bind( this );
		this.state = {
			postAuthor: false,
		};
		this.searchCache = [];
		this.requestResults = debounce( ( query, populateResults ) => {
			const payload = '?search=' + encodeURIComponent( query );
			apiFetch( { path: `/wp/v2/users${ payload }` } ).then( ( results ) => {
				populateResults( this.resolveResults( results ) );
				this.searchCache[ query ] = results;
			} );
		}, 300 );
		this.requestResults = this.requestResults.bind( this );
	}

	componentDidMount() {
		const { postAuthorId, authors, postAuthor } = this.props;

		// If the postAuthor is provided, use it directly.
		if ( postAuthor ) {
			this.setState( { postAuthor } );
		}

		const authorInAuthors = authors.find( ( singleAuthor ) => {
			return singleAuthor.id === postAuthorId;
		} );

		// Set or fetch the current author.
		if ( authorInAuthors ) {
			this.setState( { postAuthor: authorInAuthors } );
		} else {
			this.getCurrentAuthor( postAuthorId );
		}
	}

	suggestAuthor( query, populateResults ) {
		if ( query.length < 2 ) {
			return;
		}

		if ( this.searchCache[ query ] ) {
			populateResults( this.resolveResults( this.searchCache[ query ] ) );
			return;
		}

		this.requestResults( query, populateResults );
	}

	resolveResults( results ) {
		this.authors = results;
		return results.map( ( author ) => ( author.name ) );
	}

	getCurrentAuthor( authorId ) {
		if ( ! authorId ) {
			return;
		}
		apiFetch( { path: `/wp/v2/users/${ encodeURIComponent( authorId ) }` } ).then( ( results ) => {
			this.setState( { postAuthor: results } );
		} );
	}

	setAuthorId( selection ) {
		if ( ! selection ) {
			return;
		}
		const { onUpdateAuthor } = this.props;
		if ( typeof selection === 'string' ) {
			// Author name from the autocompleter.
			const author = this.authors.find( ( singleAuthor ) => {
				return singleAuthor.name === selection;
			} );
			onUpdateAuthor( Number( author.id ) );
		} else {
			// Author ID from the select.
			onUpdateAuthor( Number( selection.target.value ) );
		}
	}

	render() {
		const { postAuthor } = this.state;
		const { postAuthorId, instanceId, authors } = this.props;
		const selectId = `post-author-selector-${ instanceId }`;
		let selector;
		if ( ! postAuthor ) {
			return null;
		}

		if ( authors.length < 50 ) {
			/* eslint-disable jsx-a11y/no-onchange */
			selector =
				<select
					id={ selectId }
					value={ postAuthorId }
					className="editor-post-author__select"
					onChange={ this.setAuthorId }
				>
					{ authors.map( ( author ) => (
						<option key={ author.id } value={ author.id }>{ author.name }</option>
					) ) }
				</select>;
		} else {
			selector =
				<Autocomplete
					id={ selectId }
					minLength={ 2 }
					showAllValues={ true }
					autoselect={ true }
					defaultValue={ postAuthor ? postAuthor.name : '' }
					displayMenu="overlay"
					onConfirm={ this.setAuthorId }
					source={ this.suggestAuthor }
					showNoResultsFound={ false }
					tStatusQueryTooShort={ ( minQueryLength ) =>
						// translators: %d: the number characters required to initiate an author search.
						sprintf( __( 'Type in %d or more characters for results' ), minQueryLength )
					}
					tStatusNoResults={ () => __( 'No search results' ) }
					tStatusSelectedOption={ ( selectedOption, length ) => __( `${ selectedOption } (1 of ${ length }) is selected` ) }
					tStatusResults={ ( length, contentSelectedOption ) => {
						const words = {
							result: ( length === 1 ) ? __( 'result' ) : __( 'results' ),
							is: ( length === 1 ) ? __( 'is' ) : __( 'are' ),
						};
						return <span>{ length } { words.result } { words.is } available. { contentSelectedOption }</span>;
					} }

				/>;
		}

		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				{ postAuthor && selector }
			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthorId: select( 'core/editor' ).getEditedPostAttribute( 'author' ),
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
