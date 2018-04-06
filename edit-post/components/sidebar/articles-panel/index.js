/**
 * External dependencies
 */
import { get, isUndefined, pickBy } from 'lodash';
import { connect } from 'react-redux';
import { stringify } from 'querystringify';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { PanelBody, TextControl, CategorySelect, ArticlesList, withAPIData } from '@wordpress/components';
import { Component, compose } from '@wordpress/element';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal Dependencies
 */
import store from '../../../store';
import {
	getSelectedCategoryId,
	getSearchTerm,
	getArticles,
} from '../../../store/selectors';
import {
	setCategory,
	setSearchTerm,
	searchArticles,
} from '../../../store/actions';
import '@wordpress/core-data';

/**
 * Module Constants
 */
const PANEL_NAME = 'articles-panel';

class ArticlesPanel extends Component {
	constructor() {
		super( ...arguments );

		this.onCategoryChange = this.onCategoryChange.bind( this );
		this.onSearchInputChange = this.onSearchInputChange.bind( this );

		// this.state = {
		// 	selectedCategoryId: '',
		// 	searchTerm: '',
		// };
	}

	onCategoryChange( categoryId ) {
		console.log('onCategoryChange props', this.props);
		// this.props.selectedCategoryId = categoryId;
		// this.setState( { selectedCategoryId } );
	}

	onSearchInputChange( term ) {
		// this.props.searchTerm = term;
		// this.setState( { searchTerm } );
	}

	// componentWillUpdate( nextProps, nextState) {
	// 	// console.log( 'componentWillUpdate' );
	// 	// console.log( 'nextState', nextState );
	// 	// console.log( 'state', this.state );

	// 	const { selectedCategoryId, searchTerm } = nextState;

	// 	// Seacrh values are changed
	// 	if ( selectedCategoryId != this.state.selectedCategoryId 
	// 		 || searchTerm != this.state.searchTerm ) {
	// 		// search for articles
	// 		console.log( 'search for articles' );
	// 		this.props.searchArticles( {
	// 			selectedCategoryId: selectedCategoryId,
	// 			searchTerm: searchTerm,
	// 			articles: []
	// 		} );
	// 	}

	// 	return true;
	// }

	render() {
		const {
			isOpened,
			onTogglePanel,
			categories,
			articles,
			selectedCategoryId,
			searchTerm,
		} = this.props;

		// const { selectedCategoryId, searchTerm } = this.state;

		return (
			<PanelBody
				title={ __( 'Stories' ) }
				opened={ isOpened }
				onToggle={ onTogglePanel }
			>
				<TextControl
					placeholder={ __( 'Search articles' ) }
					value={ searchTerm }
					onChange={ this.onSearchInputChange }
				/>

				<CategorySelect
					key="query-controls-category-select"
					categoriesList={ categories }
					label={ __( 'Category' ) }
					noOptionLabel={ __( 'All' ) }
					selectedCategoryId={ selectedCategoryId }
					onChange={ this.onCategoryChange }
				/>

				<ArticlesList
					articles={ articles }
				/>
			</PanelBody>
		);
	}
}

function mapStateToPros( state ) {
	// const state = store.getState();

	console.log( 'mapStateToPros state', state );

	return { articles: [ ]/* getArticles( state ) */ };
}

function mapDispatchToProps() {
	return { searchArticles };
}

const applyWithSelect = withSelect( ( select ) => {
	const { getCategories } = select( 'core' );
	const { isEditorSidebarPanelOpened } = select( 'core/edit-post' );

	return {
		isOpened: isEditorSidebarPanelOpened( PANEL_NAME ),
		categories: getCategories(),
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	return {
		onTogglePanel() {
			return dispatch( 'core/edit-post' ).toggleGeneralSidebarEditorPanel( PANEL_NAME );
		},
	};
} );

const applyWithAPIData = withAPIData( ( props ) => {
	console.log( 'applyWithAPIData', props );
	const options = { 
		category_id: props.selectedCategoryId,
		s: props.searchTerm,
		order: 'desc',
		orderBy: 'date',
	};

	const articlesQuery = stringify( pickBy( options, value => ! isUndefined( value ) ) );

	console.log( articlesQuery );

	// if ( articleId ) {
	// 	return {
	// 		article: `/wp/v2/articles/${ articleId }`,
	// 	};
	// }
} );

export default compose( [
	// connect( mapStateToPros, mapDispatchToProps ),
	applyWithSelect,
	applyWithDispatch,
	applyWithAPIData
] )( ArticlesPanel );


// const latestPostsQuery = stringify( pickBy( {
// 		categories,
// 		order,
// 		orderBy,
// 		per_page: postsToShow,
// 		_fields: [ 'date_gmt', 'link', 'title' ],
// 	}, value => ! isUndefined( value ) ) );
// 	const categoriesListQuery = stringify( {
// 		per_page: 100,
// 		_fields: [ 'id', 'name', 'parent' ],
// 	} );
// 	return {
// 		latestPosts: `/wp/v2/posts?${ latestPostsQuery }`,


// category_id: state.search.selectedCategory,
// 				s: state.search.searchTerm,
// 				order: 'desc',
// 				orderBy: 'date',
