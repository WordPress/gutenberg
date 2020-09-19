/**
 * External dependencies
 */
import {
	escape as escapeString,
	find,
	get,
	invoke,
	isEmpty,
	map,
	throttle,
	unescape as unescapeString,
	uniqBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { FormTokenField, withFilters, Button } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { compose } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Module constants
 */
const DEFAULT_QUERY = {
	per_page: -1,
	orderby: 'count',
	order: 'desc',
	_fields: 'id,name,count',
};
const MAX_TERMS_SUGGESTIONS = 20;
const MAX_RELATED_TERMS_SUGGESTIONS = 20;
const isSameTermName = ( termA, termB ) =>
	termA.toLowerCase() === termB.toLowerCase();

/**
 * Returns a term object with name unescaped.
 * The unescape of the name property is done using lodash unescape function.
 *
 * @param {Object} term The term object to unescape.
 *
 * @return {Object} Term object with name property unescaped.
 */
const unescapeTerm = ( term ) => {
	return {
		...term,
		name: unescapeString( term.name ),
	};
};

/**
 * Returns an array of term objects with names unescaped.
 * The unescape of each term is performed using the unescapeTerm function.
 *
 * @param {Object[]} terms Array of term objects to unescape.
 *
 * @return {Object[]} Array of term objects unescaped.
 */
const unescapeTerms = ( terms ) => {
	return map( terms, unescapeTerm );
};

class FlatTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.searchTerms = throttle( this.searchTerms.bind( this ), 500 );
		this.findOrCreateTerm = this.findOrCreateTerm.bind( this );
		this.appendTerm = this.appendTerm.bind( this );
		this.toggleRelatedTerms = this.toggleRelatedTerms.bind( this );
		this.fetchRelatedTerms = this.fetchRelatedTerms.bind( this );
		this.state = {
			loading: ! isEmpty( this.props.terms ),
			availableTerms: [],
			selectedTerms: [],
			relatedTerms: [],
			areRelatedTermsHidden: true,
		};
	}

	componentDidMount() {
		if ( ! isEmpty( this.props.terms ) ) {
			this.initRequest = this.fetchTerms( {
				include: this.props.terms.join( ',' ),
				per_page: -1,
			} );
		} else {
			this.initRequest = Promise.resolve( [] );
		}

		this.initRequest.then(
			( response ) => {
				this.relatedTermsRequest = this.fetchRelatedTerms( {
					order: 'desc',
					orderby: 'count',
					per_page: MAX_RELATED_TERMS_SUGGESTIONS + response.length,
				} );

				this.relatedTermsRequest.then( () => {
					this.setState( { loading: false } );
				} );
			},
			( xhr ) => {
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.setState( {
					loading: false,
				} );
			}
		);
	}

	componentWillUnmount() {
		invoke( this.initRequest, [ 'abort' ] );
		invoke( this.searchRequest, [ 'abort' ] );
	}

	componentDidUpdate( prevProps ) {
		if ( prevProps.terms !== this.props.terms ) {
			this.updateSelectedTerms( this.props.terms );
		}
	}

	fetchTerms( params = {} ) {
		const { taxonomy } = this.props;
		const query = { ...DEFAULT_QUERY, ...params };
		const request = apiFetch( {
			path: addQueryArgs( `/wp/v2/${ taxonomy.rest_base }`, query ),
		} );
		request.then( unescapeTerms ).then( ( terms ) => {
			this.setState( ( state ) => ( {
				availableTerms: state.availableTerms.concat(
					terms.filter(
						( term ) =>
							! find(
								state.availableTerms,
								( availableTerm ) =>
									availableTerm.id === term.id
							)
					)
				),
			} ) );
			this.updateSelectedTerms( this.props.terms );
		} );

		return request;
	}

	fetchRelatedTerms( params = {} ) {
		const { taxonomy } = this.props;
		const query = { ...DEFAULT_QUERY, ...params };
		const request = apiFetch( {
			path: addQueryArgs( `/wp/v2/${ taxonomy.rest_base }`, query ),
		} );
		request.then( unescapeTerms ).then( ( terms ) => {
			let newRelatedTerms = terms.filter(
				( term ) =>
					! find(
						this.state.selectedTerms,
						( updatedTerm ) => updatedTerm === term.name
					)
			);
			const newAvailableTerms = this.state.availableTerms.concat(
				newRelatedTerms
			);

			newRelatedTerms = newRelatedTerms.splice(
				0,
				MAX_RELATED_TERMS_SUGGESTIONS
			);
			this.setState( {
				relatedTerms: newRelatedTerms,
				availableTerms: newAvailableTerms,
			} );
		} );

		return request;
	}

	updateSelectedTerms( terms = [] ) {
		const selectedTerms = terms.reduce( ( accumulator, termId ) => {
			const termObject = find(
				this.state.availableTerms,
				( term ) => term.id === termId
			);
			if ( termObject ) {
				accumulator.push( termObject.name );
			}

			return accumulator;
		}, [] );
		this.setState( {
			selectedTerms,
		} );
	}

	findOrCreateTerm( termName ) {
		const { taxonomy } = this.props;
		const termNameEscaped = escapeString( termName );
		// Tries to create a term or fetch it if it already exists.
		return apiFetch( {
			path: `/wp/v2/${ taxonomy.rest_base }`,
			method: 'POST',
			data: { name: termNameEscaped },
		} )
			.catch( ( error ) => {
				const errorCode = error.code;
				if ( errorCode === 'term_exists' ) {
					// If the terms exist, fetch it instead of creating a new one.
					this.addRequest = apiFetch( {
						path: addQueryArgs( `/wp/v2/${ taxonomy.rest_base }`, {
							...DEFAULT_QUERY,
							search: termNameEscaped,
						} ),
					} ).then( unescapeTerms );
					return this.addRequest.then( ( searchResult ) => {
						return find( searchResult, ( result ) =>
							isSameTermName( result.name, termName )
						);
					} );
				}
				return Promise.reject( error );
			} )
			.then( unescapeTerm );
	}

	onChange( termNames ) {
		const uniqueTerms = uniqBy( termNames, ( term ) => term.toLowerCase() );
		this.setState( { selectedTerms: uniqueTerms } );
		const newTermNames = uniqueTerms.filter(
			( termName ) =>
				! find( this.state.availableTerms, ( term ) =>
					isSameTermName( term.name, termName )
				)
		);
		const termNamesToIds = ( names, availableTerms ) => {
			return names.map(
				( termName ) =>
					find( availableTerms, ( term ) =>
						isSameTermName( term.name, termName )
					).id
			);
		};

		if ( newTermNames.length === 0 ) {
			return this.props.onUpdateTerms(
				termNamesToIds( uniqueTerms, this.state.availableTerms ),
				this.props.taxonomy.rest_base
			);
		}
		Promise.all( newTermNames.map( this.findOrCreateTerm ) ).then(
			( newTerms ) => {
				const newAvailableTerms = this.state.availableTerms.concat(
					newTerms
				);
				this.setState( { availableTerms: newAvailableTerms } );
				return this.props.onUpdateTerms(
					termNamesToIds( uniqueTerms, newAvailableTerms ),
					this.props.taxonomy.rest_base
				);
			}
		);
	}

	searchTerms( search = '' ) {
		invoke( this.searchRequest, [ 'abort' ] );
		this.searchRequest = this.fetchTerms( { search } );
	}

	appendTerm( newTerm ) {
		if (
			find( this.state.selectedTerms, ( selectedTerm ) => {
				isSameTermName( selectedTerm, newTerm.name );
			} )
		)
			return;

		const newSelectedTerms = this.state.selectedTerms.concat( [
			newTerm.name,
		] );

		this.onChange( newSelectedTerms );
	}

	toggleRelatedTerms() {
		this.setState( ( state ) => ( {
			areRelatedTermsHidden: ! state.areRelatedTermsHidden,
		} ) );
	}

	// Screen Reader is an extension for modern browsers which helps visually handicapped users to interact with websites.
	getTermScreenReaderString( tag, count ) {
		return `${ tag } (${ count } items)`;
	}

	render() {
		const { slug, taxonomy, hasAssignAction } = this.props;

		if ( ! hasAssignAction ) {
			return null;
		}

		const { loading, availableTerms, selectedTerms } = this.state;
		const termNames = availableTerms.map( ( term ) => term.name );
		const newTermLabel = get(
			taxonomy,
			[ 'labels', 'add_new_item' ],
			slug === 'post_tag' ? __( 'Add new tag' ) : __( 'Add new Term' )
		);
		const singularName = get(
			taxonomy,
			[ 'labels', 'singular_name' ],
			slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' )
		);
		const name = get( taxonomy, [ 'labels', 'name' ] );
		const termAddedLabel = sprintf(
			/* translators: %s: term name. */
			_x( '%s added', 'term' ),
			singularName
		);
		const termRemovedLabel = sprintf(
			/* translators: %s: term name. */
			_x( '%s removed', 'term' ),
			singularName
		);
		const removeTermLabel = sprintf(
			/* translators: %s: term name. */
			_x( 'Remove %s', 'term' ),
			singularName
		);
		const tagsButtonLabel = sprintf(
			/* translators: %s: term name. */
			_x( 'Choose from the most used %s', 'terms' ),
			name
		);

		return (
			<div>
				<FormTokenField
					value={ selectedTerms }
					suggestions={ termNames }
					onChange={ this.onChange }
					onInputChange={ this.searchTerms }
					maxSuggestions={ MAX_TERMS_SUGGESTIONS }
					disabled={ loading }
					label={ newTermLabel }
					messages={ {
						added: termAddedLabel,
						removed: termRemovedLabel,
						remove: removeTermLabel,
					} }
				/>
				<div className="editor-post-taxonomies__flat-terms-related-list-wrapper">
					<Button
						className="is-link"
						onClick={ () => this.toggleRelatedTerms() }
						aria-expanded={ ! this.state.areRelatedTermsHidden }
					>
						{ tagsButtonLabel }
					</Button>
					{ ! this.state.areRelatedTermsHidden ? (
						/* eslint-disable jsx-a11y/no-redundant-roles */
						<ul
							role="list"
							className="editor-post-taxonomies__flat-terms-related-list"
						>
							{ this.state.relatedTerms.map( ( term, index ) => (
								<li key={ index }>
									<Button
										aria-label={ this.getTermScreenReaderString(
											term.name,
											term.count
										) }
										key={ term.id }
										className="is-link"
										onClick={ () =>
											this.appendTerm( term )
										}
									>
										{ term.name }
									</Button>
								</li>
							) ) }
						</ul>
					) : (
						<ul></ul>
						/* eslint-enable jsx-a11y/no-redundant-roles */
					) }
				</div>
			</div>
		);
	}
}

export default compose(
	withSelect( ( select, { slug } ) => {
		const { getCurrentPost } = select( 'core/editor' );
		const { getTaxonomy } = select( 'core' );
		const taxonomy = getTaxonomy( slug );
		return {
			hasCreateAction: taxonomy
				? get(
						getCurrentPost(),
						[ '_links', 'wp:action-create-' + taxonomy.rest_base ],
						false
				  )
				: false,
			hasAssignAction: taxonomy
				? get(
						getCurrentPost(),
						[ '_links', 'wp:action-assign-' + taxonomy.rest_base ],
						false
				  )
				: false,
			terms: taxonomy
				? select( 'core/editor' ).getEditedPostAttribute(
						taxonomy.rest_base
				  )
				: [],
			taxonomy,
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onUpdateTerms( terms, restBase ) {
				dispatch( 'core/editor' ).editPost( { [ restBase ]: terms } );
			},
		};
	} ),
	withFilters( 'editor.PostTaxonomyType' )
)( FlatTermSelector );
