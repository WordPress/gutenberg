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
import accessibleAutocomplete from 'accessible-autocomplete';
import './accessible-autocomplete.css';
import { findWhere } from 'underscore';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
		this.suggestAuthor = this.suggestAuthor.bind( this );
	}

	componentDidMount() {
		const { instanceId, authors } = this.props;
		this.authors = authors;
		accessibleAutocomplete.enhanceSelectElement( {
		  selectElement: document.querySelector( '#post-author-selector-' + instanceId ),
		  minLength: 2,
		  showAllValues: true,
		  autoselect: true,
		  displayMenu: 'overlay',
		  onConfirm: this.setAuthorId,
		  source: this.suggestAuthor,
		} );
	}

	suggestAuthor( query, populateResults ) {
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
		console.log( 'author.id', author.id );
		onUpdateAuthor( Number( author.id ) );
	}

	render() {
		const { postAuthor, instanceId, authors } = this.props;
		const selectId = 'post-author-selector-' + instanceId;

		// Disable reason: A select with an onchange throws a warning

		/* eslint-disable jsx-a11y/no-onchange */
		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				<select
					id={ selectId }
					value={ postAuthor }
					className="editor-post-author__select"
				>
					{ authors.map( ( author ) => (
						<option key={ author.id } value={ author.id }>{ author.name }</option>
					) ) }
				</select>
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
