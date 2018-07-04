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
import Autocomplete from 'accessible-autocomplete/react'

import './accessible-autocomplete.css';
import { findWhere, debounce } from 'underscore';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
		this.suggestAuthor = this.suggestAuthor.bind( this );
	}

	suggestAuthor( query, populateResults ) {
		if ( query.length < 2 ) {
			return;
		}
		const payload = '?search=' + encodeURIComponent( query );
		apiRequest( { path: '/wp/v2/users' + payload } ).done( ( results ) => {
			this.authors = results;
			populateResults( results.map( ( author ) => ( author.name ) ) );
		} );
	}

	setAuthorId( selectedName ) {
		if ( ! selectedName ) {
			return;
		}
		const { onUpdateAuthor } = this.props;
		const author = findWhere( this.authors, { name: selectedName } );
		onUpdateAuthor( Number( author.id ) );
	}

	render() {
		const { postAuthorId, postAuthor, instanceId, authors } = this.props;
		const selectId = 'post-author-selector-' + instanceId;
		let selector;

		if ( authors.length < 50 ) {
			selector = <select
							id={ selectId }
							value={ postAuthorId }
							className="editor-post-author__select"
						>
							{ authors.map( ( author ) => (
								<option key={ author.id } value={ author.id }>{ author.name }</option>
							) ) }
						</select>;
		} else {
			selector = <Autocomplete
							id={ selectId }
							source={ authors }
							minLength={ 2 }
							showAllValues={ true }
							defaultValue={ postAuthor && postAuthor[0] ? postAuthor[0].name : '' }
							autoselect={ true }
							displayMenu='overlay'
							onConfirm={ this.setAuthorId }
							source={ debounce( this.suggestAuthor, 300 ) }
							showNoResultsFound={ false }
							tStatusQueryTooShort={ ( minQueryLength ) =>
								__( `Type in ${ minQueryLength } or more characters for results` ) }
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

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				{ postAuthor[0] && selector }
			</PostAuthorCheck>
		);
		/* eslint-enable jsx-a11y/no-onchange */
	}
}

export default compose( [
	withSelect( ( select ) => {
		return {
			postAuthorId: select( 'core/editor' ).getEditedPostAttribute( 'author' ),
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
] )( PostAuthor );
