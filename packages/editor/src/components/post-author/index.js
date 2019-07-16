/**
 * External dependencies
 */
import Autocomplete from 'accessible-autocomplete/react';
import { debounce } from 'lodash';

/**
 * WordPress dependencies
 */
import { sprintf, __, _n } from '@wordpress/i18n';
import { withInstanceId, compose } from '@wordpress/compose';
import { Component } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import PostAuthorCheck from './check';

export class PostAuthor extends Component {
	constructor() {
		super( ...arguments );

		this.setAuthorId = this.setAuthorId.bind( this );
		this.suggestAuthor = this.suggestAuthor.bind( this );
		this.getCurrentAuthor = this.getCurrentAuthor.bind( this );
		this.resolveResults = this.resolveResults.bind( this );
		this.requestResults = debounce( ( query, populateResults ) => {
			const payload = '?search=' + encodeURIComponent( query );
			apiFetch( { path: `/wp/v2/users${ payload }` } ).then( ( results ) => {
				populateResults( this.resolveResults( results ) );
				this.searchCache[ query ] = results;
			} );
		}, 300 );
		this.searchCache = [];
		this.state = {
			postAuthor: false,
			initialAuthors: [],
			currentSelection: '',
		};
	}

	// Get the initial author from props if available.
	getInitialPostAuthor() {
		return this.props.postAuthor;
	}

	componentDidMount() {
		const { postAuthorId, authors } = this.props;

		// Load the initial post author.
		const postAuthor = this.getInitialPostAuthor();
		if ( postAuthor ) {
			this.setState( {
				postAuthor,
				currentSelection: this.authorUniqueName( postAuthor ),
			} );
		}

		const authorInAuthors = authors.find( ( singleAuthor ) => {
			return singleAuthor.id === postAuthorId;
		} );

		// Set or fetch the current author.
		if ( authorInAuthors ) {
			this.setState( {
				postAuthor: authorInAuthors,
				currentSelection: this.authorUniqueName( authorInAuthors ),
			} );
		} else {
			this.getCurrentAuthor( postAuthorId );
		}

		// Store a set of authors for display as initial results when uysing an autocomplete.
		this.setState( { initialAuthors: authors.slice( 0, 9 ) } );
	}

	/**
	 * Construct a unique author string from an author object in the form `${ author.name } (${ author.slug })`.
	 *
	 * @param {Object} author An author object.
	 *
	 * @return {string} An author name for display.
	 */
	authorUniqueName( author ) {
		if ( ! author || ! author.name || ! author.slug ) {
			return '';
		}
		return `${ author.name } (${ author.slug })`;
	}

	/**
	 * Search for authors that match the passed query, passing them to a callback function when resolved.
	 *
	 * @param {string} query             The search query.
	 * @param {Function} populateResults A callback function which receives the results.
	 */
	suggestAuthor( query, populateResults ) {
		// If the query is the current selection, return the first 10 users.
		const {
			initialAuthors,
			currentSelection,
		} = this.state;
		if ( query === currentSelection ) {
			populateResults( this.resolveResults( initialAuthors ) );
			return;
		}

		if ( query.length < 2 ) {
			populateResults( this.resolveResults( initialAuthors ) );
			return;
		}

		if ( this.searchCache[ query ] ) {
			populateResults( this.resolveResults( this.searchCache[ query ] ) );
			return;
		}

		this.requestResults( query, populateResults );
	}

	/**
	 * Resolve the author objects into strings for display.
	 *
	 * @param {Array} results The array of authors that matched the search.
	 *
	 * @return {Array} an array of strings ready for displaying.
	 */
	resolveResults( results ) {
		this.authors = results;
		return results.map( ( author ) => ( this.authorUniqueName( author ) ) );
	}

	/**
	 * Retrieve the author object by id and set in state.
	 *
	 * @param {number} authorId The id of the author to fetch.
	 */
	getCurrentAuthor( authorId ) {
		if ( ! authorId ) {
			return;
		}
		apiFetch( { path: `/wp/v2/users/${ encodeURIComponent( authorId ) }` } ).then( ( results ) => {
			this.setState( {
				postAuthor: results,
				currentSelection: this.authorUniqueName( results ),
			} );
		} );
	}

	/**
	 * Set the current author based on the selection. Handles strings passed from the HTML
	 * select element or strings passed from the autcomplete component.
	 *
	 * @param {number|string} selection The author id or name that was selected.
	 */
	setAuthorId( selection ) {
		if ( ! selection ) {
			return;
		}
		const { onUpdateAuthor } = this.props;
		if ( typeof selection === 'string' ) {
			// Author name from the autocompleter.
			const author = this.authors.find( ( singleAuthor ) => {
				return this.authorUniqueName( singleAuthor ) === selection;
			} );
			if ( author ) {
				this.setState( { currentSelection: selection } );
				onUpdateAuthor( Number( author.id ) );
			}
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

		// If there are a small number of users, use a regular select element; once the list grows to a certain size, switch
		// to an accessible auto-complete component.
		if ( authors.length < 99 ) {
			// Disable reason: A select with an onchange throws a warning.
			/* eslint-disable jsx-a11y/no-onchange */
			selector =
				<select
					id={ selectId }
					value={ postAuthorId }
					onChange={ this.setAuthorId }
					className="editor-post-author__select"
				>
					{ authors.map( ( author ) => (
						<option key={ author.id } value={ author.id }>{ decodeEntities( author.name ) }</option>
					) ) }
				</select>;
		} else {
			selector =
				<Autocomplete
					id={ selectId }
					minLength={ 2 }
					showAllValues={ true }
					defaultValue={ postAuthor ? this.authorUniqueName( postAuthor ) : '' }
					displayMenu="overlay"
					onConfirm={ this.setAuthorId }
					source={ this.suggestAuthor }
					showNoOptionsFound={ false }
					preserveNullOptions={ true }
					tStatusQueryTooShort={ ( minQueryLength ) =>
						// translators: %d: the number characters required to initiate an author search.
						sprintf( __( 'Type in %d or more characters for results' ), minQueryLength )
					}
					tStatusNoResults={ () => __( 'No search results' ) }
					// translators: 1: the index of thre selected result. 2: The total number of results.
					tStatusSelectedOption={ ( selectedOption, length ) => sprintf( __( '%1$s (1 of %2$s) is selected' ), selectedOption, length ) }
					tStatusResults={ ( length, contentSelectedOption ) => {
						return (
							_n( '%d result is available.', '%d results are available.', length ) +
							' ' + contentSelectedOption
						);
					} }
					cssNamespace="components-post-author__autocomplete"

				/>;
		}

		return (
			<PostAuthorCheck>
				<label htmlFor={ selectId }>{ __( 'Author' ) }</label>
				{ selector }
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
