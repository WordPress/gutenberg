/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TextControl, CategorySelect } from '@wordpress/components';
import { Component, Fragment } from '@wordpress/element';
import { withSelect } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import PostsSearch from './posts-search';

class PostsPanel extends Component {
	constructor() {
		super( ...arguments );

		this.onCategoryChange = this.onCategoryChange.bind( this );
		this.onInputChange = this.onInputChange.bind( this );

		this.state = {
			categoryId: '',
			term: '',
		};
	}

	onCategoryChange( categoryId ) {
		this.setState( { categoryId } );
	}

	onInputChange( term ) {
		this.setState( { term } );
	}

	render() {
		const { categories } = this.props;
		const { categoryId, term } = this.state;

		return (
			<Fragment>
				<TextControl
					placeholder={ __( 'Search posts' ) }
					value={ term }
					onChange={ this.onInputChange }
				/>

				<CategorySelect
					key="query-controls-category-select"
					categoriesList={ categories }
					label={ __( 'Category' ) }
					noOptionLabel={ __( 'All' ) }
					selectedCategoryId={ categoryId }
					onChange={ this.onCategoryChange }
				/>

				<PostsSearch
					options={ { categoryId, term } }
				/>
			</Fragment>
		);
	}
}

export default withSelect( ( select ) => {
	const { getCategories, isRequestingCategories } = select( 'core' );

	return {
		categories: getCategories(),
		isRequesting: isRequestingCategories(),
	};
} )( PostsPanel );
