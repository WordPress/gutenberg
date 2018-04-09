/**
 * WordPress dependencies
 */
import { Component, compose } from '@wordpress/element';
import { PanelBody, TextControl, CategorySelect } from '@wordpress/components';
import { withSelect, withDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';

/**
 * Internal Dependencies
 */
import '@wordpress/core-data';
import ArticlesSearch from '../../articles-search';

/**
 * Module Constants
 */
const PANEL_NAME = 'articles-panel';

class ArticlesPanel extends Component {
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
		const { isOpened, onTogglePanel, categories } = this.props;
		const { categoryId, term } = this.state;

		return (
			<PanelBody
				title={ __( 'Stories' ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<TextControl
					placeholder={ __( 'Search articles' ) }
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

				<ArticlesSearch
					options={ { categoryId, term } }
				/>
			</PanelBody>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { isEditorSidebarPanelOpened } = select( 'core/edit-post' );
	const { getCategories, isRequestingCategories } = select( 'core' );

	return {
		isOpened: isEditorSidebarPanelOpened( PANEL_NAME ),
		categories: getCategories(),
		isRequesting: isRequestingCategories(),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	return {
		onTogglePanel() {
			return dispatch( 'core/edit-post' ).toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	};
} );

export default compose( [
	applyWithSelect,
	applyWithDispatch,
] )( ArticlesPanel );
