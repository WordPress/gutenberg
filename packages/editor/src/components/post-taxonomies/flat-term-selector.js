/**
 * External dependencies
 */
import {
	debounce,
	escape as escapeString,
	find,
	get,
	invoke,
	isEmpty,
	uniqBy,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import {
	FormTokenField,
	withFilters,
	withSpokenMessages,
} from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { compose } from '@wordpress/compose';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { store as editorStore } from '../../store';
import { unescapeString, unescapeTerm, unescapeTerms } from '../../utils/terms';
import MostUsedTerms from './most-used-terms';

/**
 * Module constants
 */
const MAX_TERMS_SUGGESTIONS = 20;
const DEFAULT_QUERY = {
	per_page: MAX_TERMS_SUGGESTIONS,
	orderby: 'count',
	order: 'desc',
	_fields: 'id,name,count',
};

const isSameTermName = ( termA, termB ) =>
	unescapeString( termA ).toLowerCase() ===
	unescapeString( termB ).toLowerCase();

const termNamesToIds = ( names, terms ) => {
	return names.map(
		( termName ) =>
			find( terms, ( term ) => isSameTermName( term.name, termName ) ).id
	);
};

class FlatTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.searchTerms = debounce( this.searchTerms.bind( this ), 500 );
		this.findOrCreateTerm = this.findOrCreateTerm.bind( this );
		this.appendTerm = this.appendTerm.bind( this );
		this.state = {
			loading: ! isEmpty( this.props.terms ),
			availableTerms: [],
			selectedTerms: [],
		};
	}

	componentDidMount() {
		if ( ! isEmpty( this.props.terms ) ) {
			this.initRequest = this.fetchTerms( {
				include: this.props.terms.join( ',' ),
				per_page: -1,
			} );
			this.initRequest.then(
				() => {
					this.setState( { loading: false } );
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
		if ( search.length >= 3 ) {
			this.searchRequest = this.fetchTerms( { search } );
		}
	}

	appendTerm( newTerm ) {
		const { onUpdateTerms, taxonomy, terms = [], slug, speak } = this.props;

		if ( terms.includes( newTerm.id ) ) {
			return;
		}

		const newTerms = [ ...terms, newTerm.id ];

		const termAddedMessage = sprintf(
			/* translators: %s: term name. */
			_x( '%s added', 'term' ),
			get(
				taxonomy,
				[ 'labels', 'singular_name' ],
				slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' )
			)
		);

		speak( termAddedMessage, 'assertive' );

		this.setState( {
			availableTerms: [ ...this.state.availableTerms, newTerm ],
		} );

		onUpdateTerms( newTerms, taxonomy.rest_base );
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

		return (
			<>
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
				<MostUsedTerms
					taxonomy={ taxonomy }
					onSelect={ this.appendTerm }
				/>
			</>
		);
	}
}

export default compose(
	withSelect( ( select, { slug } ) => {
		const { getCurrentPost } = select( editorStore );
		const { getTaxonomy } = select( coreStore );
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
				? select( editorStore ).getEditedPostAttribute(
						taxonomy.rest_base
				  )
				: [],
			taxonomy,
		};
	} ),
	withDispatch( ( dispatch ) => {
		return {
			onUpdateTerms( terms, restBase ) {
				dispatch( editorStore ).editPost( { [ restBase ]: terms } );
			},
		};
	} ),
	withSpokenMessages,
	withFilters( 'editor.PostTaxonomyType' )
)( FlatTermSelector );
