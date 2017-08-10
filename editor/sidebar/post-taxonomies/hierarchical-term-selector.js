/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape as unescapeString, without, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const DEFAULT_QUERY = {
	per_page: 100,
	orderby: 'count',
	order: 'desc',
};

class HierarchicalTermSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onChange = this.onChange.bind( this );
		this.state = {
			loading: true,
			availableTerms: [],
		};
	}

	buildTermsTree( flatTerms ) {
		const termsByParent = groupBy( flatTerms, 'parent' );
		const fillWithChildren = ( terms ) => {
			return terms.map( ( term ) => {
				const children = termsByParent[ term.id ];
				return {
					...term,
					children: children && children.length
						? fillWithChildren( children )
						: [],
				};
			} );
		};

		return fillWithChildren( termsByParent[ 0 ] || [] );
	}

	componentDidMount() {
		const Collection = wp.api.getTaxonomyCollection( this.props.slug );
		this.fetchRequest = new Collection()
			.fetch( { data: DEFAULT_QUERY } )
			.done( ( terms ) => {
				const availableTerms = this.buildTermsTree( terms );

				this.setState( {
					loading: false,
					availableTerms,
				} );
			} )
			.fail( ( xhr ) => {
				if ( xhr.statusText === 'abort' ) {
					return;
				}
				this.setState( {
					loading: false,
				} );
			} );
	}

	componentWillUnmount() {
		this.fetchRequest.abort();
	}

	onChange( event ) {
		const { onUpdateTerms, terms = [], restBase } = this.props;
		const termId = parseInt( event.target.value, 10 );
		const hasTerm = terms.indexOf( termId ) !== -1;
		const newTerms = hasTerm
			? without( terms, termId )
			: [ ...terms, termId ];
		onUpdateTerms( newTerms, restBase );
	}

	renderTerms( renderedTerms ) {
		const { terms = [] } = this.props;
		return renderedTerms.map( ( term ) => {
			const id = `editor-post-taxonomies-hierarchical-term-${ term.id }`;
			return (
				<div key={ term.id } className="editor-post-taxonomies__hierarchical-terms-choice">
					<input
						id={ id }
						className="editor-post-taxonomies__hierarchical-terms-input"
						type="checkbox"
						checked={ terms.indexOf( term.id ) !== -1 }
						value={ term.id }
						onChange={ this.onChange }
					/>
					<label htmlFor={ id }>{ unescapeString( term.name ) }</label>
					{ !! term.children.length && (
						<div className="editor-post-taxonomies__hierarchical-terms-subchoices">
							{ this.renderTerms( term.children ) }
						</div>
					) }
				</div>
			);
		} );
	}

	render() {
		const { availableTerms } = this.state;
		const { label } = this.props;

		return (
			<div className="editor-post-taxonomies__hierarchical-terms-selector">
				<h4 className="editor-post-taxonomies__hierarchical-terms-selector-title">{ label }</h4>
				{ this.renderTerms( availableTerms ) }
			</div>
		);
	}
}

export default connect(
	( state, onwProps ) => {
		return {
			terms: getEditedPostAttribute( state, onwProps.restBase ),
		};
	},
	{
		onUpdateTerms( terms, restBase ) {
			return editPost( { [ restBase ]: terms } );
		},
	}
)( HierarchicalTermSelector );

