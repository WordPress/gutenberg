/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { get, unescape as unescapeString, find, forEach } from 'lodash';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { Component, compose } from '@wordpress/element';
import { FormTokenField } from '@wordpress/components';

/**
 * Internal dependencies
 */
import {
	getEditedPostAttribute,
	getTaxonomyTermFetchStatus,
	getTaxonomyTerms,
} from '../../store/selectors';
import { editPost, addTaxonomyTerm } from '../../store/actions';

const MAX_TERMS_SUGGESTIONS = 20;

class FlatTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.state = {
			selectedTerms: this.getSelectedTerms( this.props.terms, this.props.availableTerms ),
		};
	}

	componentWillReceiveProps( newProps ) {
		if ( newProps.terms !== this.props.terms || newProps.availableTerms !== this.props.availableTerms ) {
			this.setState( {
				selectedTerms: this.getSelectedTerms( newProps.terms, newProps.availableTerms ),
			} );
		}
	}

	getSelectedTerms( termIds = [], availableTerms = [] ) {
		const selectedTerms = [];
		forEach( termIds, termId => {
			const termObject = this.findTermById( availableTerms, termId );
			if ( termObject ) {
				selectedTerms.push( termObject.name );
			}
		} );
		return selectedTerms;
	}

	findTermById( terms, id ) {
		return find( terms, term => term.id === id );
	}

	findTermByName( terms, name ) {
		return find( terms, term => term.name === name );
	}

	onChange( termNames ) {
		const { availableTerms, slug, restBase, onUpdateTerms } = this.props;

		const updateTermIds = [];
		forEach( termNames, ( termName ) => {
			const termObject = this.findTermByName( availableTerms, termName );
			if ( termObject ) {
				updateTermIds.push( termObject.id );
			} else {
				this.props.addTaxonomyTerm( slug, restBase, termName, 0 );
			}
		} );
		onUpdateTerms( updateTermIds, restBase );
	}

	render() {
		const { label, slug, taxonomy, loading, availableTerms } = this.props;
		const { selectedTerms } = this.state;
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

const applyConnect = connect(
	( state, ownProps ) => {
		return {
			terms: getEditedPostAttribute( state, ownProps.restBase ),
			loading: get( getTaxonomyTermFetchStatus( state, ownProps.slug ), 'requesting', true ),
			availableTerms: getTaxonomyTerms( state, ownProps.slug ),
		};
	},
	{
		onUpdateTerms( terms, restBase ) {
			return editPost( { [ restBase ]: terms } );
		},
		addTaxonomyTerm,
	}
);

export default compose(
	applyConnect,
)( FlatTermSelector );
