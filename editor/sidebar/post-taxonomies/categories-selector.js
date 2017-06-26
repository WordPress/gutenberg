/**
 * External dependencies
 */
import { connect } from 'react-redux';
import { unescape as unescapeString, without, groupBy } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from 'i18n';
import { Component } from 'element';

/**
 * Internal dependencies
 */
import { getEditedPostAttribute } from '../../selectors';
import { editPost } from '../../actions';

const DEFAULT_CATEGORIES_QUERY = {
	per_page: -1,
	orderby: 'count',
	order: 'DESC',
};

class CategoriesSelector extends Component {
	constructor() {
		super( ...arguments );
		this.onCategoriesChange = this.onCategoriesChange.bind( this );
		this.state = {
			loading: true,
			availableCategories: [],
		};
	}

	buildCategoriesTree( flatCategories ) {
		const categoriesByParent = groupBy( flatCategories, 'parent' );
		const fillWithChildren = ( categories ) => {
			return categories.map( category => {
				const children = categoriesByParent[ category.id ];
				return {
					...category,
					children: children && children.length
						? fillWithChildren( children )
						: [],
				};
			} );
		};

		return fillWithChildren( categoriesByParent[ 0 ] || [] );
	}

	componentDidMount() {
		this.fetchCategoriesRequest = new wp.api.collections.Categories().fetch( DEFAULT_CATEGORIES_QUERY )
			.done( ( categories ) => {
				const availableCategories = this.buildCategoriesTree( categories );

				this.setState( {
					loading: false,
					availableCategories,
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
		if ( this.fetchCategoriesRequest ) {
			this.fetchCategoriesRequest.abort();
		}
	}

	onCategoriesChange( event ) {
		const { onUpdateCategories, categories = [] } = this.props;
		const categoryId = parseInt( event.target.value, 10 );
		const hasCategory = categories.indexOf( categoryId ) !== -1;
		const newCategories = hasCategory
			? without( categories, categoryId )
			: [ ...categories, categoryId ];
		onUpdateCategories( newCategories );
	}

	renderCategories( renderedCategories ) {
		const { categories = [] } = this.props;
		return renderedCategories.map( ( category ) => {
			const id = `editor-post-taxonomies-category-${ category.id }`;
			return (
				<div key={ category.id } className="editor-post-taxonomies__categories-choice">
					<input
						id={ id }
						className="editor-post-taxonomies__categories-input"
						type="checkbox"
						checked={ categories.indexOf( category.id ) !== -1 }
						value={ category.id }
						onChange={ this.onCategoriesChange }
					/>
					<label htmlFor={ id }>{ unescapeString( category.name ) }</label>
					{ !! category.children.length && (
						<div className="editor-post-taxonomies__categories-subchoices">
							{ this.renderCategories( category.children ) }
						</div>
					) }
				</div>
			);
		} );
	}

	render() {
		const { availableCategories } = this.state;

		return (
			<div className="editor-post-taxonomies__categories-selector">
				<h4 className="editor-post-taxonomies__categories-selector-title">{ __( 'Categories' ) }</h4>
				{ this.renderCategories( availableCategories ) }
			</div>
		);
	}
}

export default connect(
	( state ) => {
		return {
			categories: getEditedPostAttribute( state, 'categories' ),
		};
	},
	{
		onUpdateCategories( categories ) {
			return editPost( { categories } );
		},
	}
)( CategoriesSelector );

