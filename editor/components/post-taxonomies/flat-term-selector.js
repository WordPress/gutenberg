/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, unescape as unescapeString, find, throttle } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { FormTokenField, withAPIData } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../store/selectors';
import { editPost } from '../../store/actions';

const DEFAULT_QUERY = {
	per_page: 100,
	orderby: 'count',
	order: 'desc',
	_fields: [ 'id', 'name' ],
};
const MAX_TERMS_SUGGESTIONS = 20;

class FlatTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.searchTerms = throttle( this.searchTerms.bind( this ), 500 );
		this.findOrCreateTerm = this.findOrCreateTerm.bind( this );
		this.state = {
			loading: false,
			availableTerms: [],
			selectedTerms: [],
		};
	}

	componentDidMount() {
		if ( this.props.terms ) {
			this.setState( { loading: false } );
			this.initRequest = this.fetchTerms( { include: this.props.terms } );
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
		this.searchTerms();
	}

	componentWillUnmount() {
		this.initRequest.abort();
		if ( this.searchRequest ) {
			this.searchRequest.abort();
		}
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.terms !== this.props.terms ) {
			this.updateSelectedTerms( newProps.terms );
		}
	}

	fetchTerms( params = {} ) {
		const query = { ...DEFAULT_QUERY, ...params };
		const Collection = wp.api.getTaxonomyCollection( this.props.slug );
		const request = new Collection().fetch( { data: query } );
		request.then( ( terms ) => {
			this.setState( ( state ) => ( {
				availableTerms: state.availableTerms.concat(
					terms.filter( ( term ) => ! find( state.availableTerms, ( availableTerm ) => availableTerm.id === term.id ) )
				),
			} ) );
			this.updateSelectedTerms( this.props.terms );
		} );

		return request;
	}

	updateSelectedTerms( terms = [] ) {
		const selectedTerms = terms.map( ( termId ) => {
			const termObject = find( this.state.availableTerms, ( term ) => term.id === termId );
			return termObject ? termObject.name : '';
		} );
		this.setState( {
			selectedTerms,
		} );
	}

	findOrCreateTerm( termName ) {
		return new Promise( ( resolve, reject ) => {
			// Tries to create a term or fetch it if it already exists
			const Model = wp.api.getTaxonomyModel( this.props.slug );
			new Model( { name: termName } ).save()
				.then( resolve, ( xhr ) => {
					const errorCode = xhr.responseJSON && xhr.responseJSON.code;
					if ( errorCode === 'term_exists' ) {
						// search the new category created since last fetch
						this.addRequest = new Model().fetch(
							{ data: { ...DEFAULT_QUERY, search: termName } }
						);
						return this.addRequest.then( searchResult => {
							resolve( find( searchResult, result => result.name === termName ) );
						}, reject );
					}
					reject( xhr );
				} );
		} );
	}

	onChange( termNames ) {
		this.setState( { selectedTerms: termNames } );
		const newTermNames = termNames.filter( ( termName ) =>
			! find( this.state.availableTerms, ( term ) => term.name === termName )
		);
		const termNamesToIds = ( names, availableTerms ) => {
			return names
				.map( ( termName ) =>
					find( availableTerms, ( term ) => term.name === termName ).id
				);
		};

		if ( newTermNames.length === 0 ) {
			return this.props.onUpdateTerms( termNamesToIds( termNames, this.state.availableTerms ), this.props.restBase );
		}
		Promise
			.all( newTermNames.map( this.findOrCreateTerm ) )
			.then( ( newTerms ) => {
				const newAvailableTerms = this.state.availableTerms.concat( newTerms );
				this.setState( { availableTerms: newAvailableTerms } );
				return this.props.onUpdateTerms( termNamesToIds( termNames, newAvailableTerms ), this.props.restBase );
			} );
	}

	searchTerms( search = '' ) {
		if ( this.searchRequest ) {
			this.searchRequest.abort();
		}
		this.searchRequest = this.fetchTerms( { search } );
	}

	render() {
		const { label, slug, taxonomy } = this.props;
		const { loading, availableTerms, selectedTerms } = this.state;
		const termNames = availableTerms.map( ( term ) => term.name );

		const newTermPlaceholderLabel = get(
			taxonomy,
			[ 'data', 'labels', 'add_new_item' ],
			slug === 'post_tag' ? __( 'Add New Tag' ) : __( 'Add New Term' )
		);
		const singularName = get(
			taxonomy,
			[ 'data', 'labels', 'singular_name' ],
			slug === 'post_tag' ? __( 'Tag' ) : __( 'Term' )
		);
		const termAddedLabel = sprintf( _x( '%s added', 'term' ), singularName );
		const termRemovedLabel = sprintf( _x( '%s removed', 'term' ), singularName );
		const removeTermLabel = sprintf( _x( 'Remove %s: %%s', 'term' ), singularName );

		return (
			<div className="editor-post-taxonomies__flat-terms-selector">
				<h3 className="editor-post-taxonomies__flat-terms-selector-title">{ label }</h3>
				<FormTokenField
					value={ selectedTerms }
					displayTransform={ unescapeString }
					suggestions={ termNames }
					onChange={ this.onChange }
					onInputChange={ this.searchTerms }
					maxSuggestions={ MAX_TERMS_SUGGESTIONS }
					disabled={ loading }
					placeholder={ newTermPlaceholderLabel }
					messages={ {
						added: termAddedLabel,
						removed: termRemovedLabel,
						remove: removeTermLabel,
					} }
				/>
			</div>
		);
	}
}

const applyWithAPIData = withAPIData( ( props ) => {
	const { slug } = props;
	return {
		taxonomy: `/wp/v2/taxonomies/${ slug }?context=edit`,
	};
} );

const applyConnect = connect(
	( state, ownProps ) => {
		return {
			terms: getEditedPostAttribute( state, ownProps.restBase ),
		};
	},
	( dispatch ) => {
		return {
			onUpdateTerms( terms, restBase ) {
				dispatch( editPost( { [ restBase ]: terms } ) );
			},
		};
	}
);

export default compose(
	applyWithAPIData,
	applyConnect,
)( FlatTermSelector );
