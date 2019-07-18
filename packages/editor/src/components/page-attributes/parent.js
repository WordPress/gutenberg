/**
 * External dependencies
 */
import { get, debounce } from 'lodash';
import Autocomplete from 'accessible-autocomplete/react';

/**
 * WordPress dependencies
 */
import { sprintf, __, _n } from '@wordpress/i18n';
import { TreeSelect } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';
import { Component } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

export class PageAttributesParent extends Component {
	constructor() {
		super( ...arguments );
		this.searchCache = [];
		this.getCurrentParentFromAPI = this.getCurrentParentFromAPI.bind( this );
		this.handleSelection = this.handleSelection.bind( this );
		this.suggestPage = this.suggestPage.bind( this );

		this.requestResults = debounce( ( query, populateResults ) => {
			const payload = '?search=' + encodeURIComponent( query );
			apiFetch( { path: `/wp/v2/pages${ payload }` } ).then( ( results ) => {
				populateResults( this.resolveResults( results ) );
				this.searchCache[ query ] = results;
			} );
		}, 300 );
		this.state = {
			parentPost: false,
		};
	}

	/**
	 * Retrieve the parent page by id.
	 *
	 * @param {number} parentId The id of the parent to fetch.
	 */
	async getCurrentParentFromAPI( parentId ) {
		if ( ! parentId ) {
			return '';
		}
		const parentPost = await apiFetch( { path: `/wp/v2/pages/${ parentId }` } );
		this.setState( {
			parentPost,
		} );
	}

	/**
	 * Resolve the results for display.
	 *
	 * @param {Array} results The array of pages that matched the search.
	 *
	 * @return {Array} an array of strings ready for displaying.
	 */
	resolveResults( results ) {
		return results.map( ( item ) => item.title.rendered ? `${ item.title.rendered } (#${ item.id })` : `${ __( 'no title' ) } (#${ item.id })` );
	}

	handleSelection( selection ) {
		const { onUpdateParent } = this.props;

		// Extract the id from the selection.
		const matches = selection.match( /.*\(#(\d*)\)$/ );
		if ( matches && matches[ 1 ] ) {
			onUpdateParent( matches[ 1 ] );
		}
	}

	/**
	 * Search for pages that match the passed query, passing them to a callback function when resolved.
	 *
	 * @param {string} query             The search query.
	 * @param {Function} populateResults A callback function which receives the results.
	 */
	suggestPage( query, populateResults ) {
		const { items } = this.props;

		if ( query === items ) {
			populateResults( this.resolveResults( items ) );
			return;
		}

		if ( query.length < 2 ) {
			populateResults( this.resolveResults( items ) );
			return;
		}

		if ( this.searchCache[ query ] ) {
			populateResults( this.resolveResults( this.searchCache[ query ] ) );
			return;
		}

		this.requestResults( query, populateResults );
	}

	render() {
		const { postType, items, onUpdateParent, parent } = this.props;
		const { parentPost } = this.state;
		let currentParent = false;

		if ( ! parentPost && false !== parent ) {
			if ( 0 === parent ) {
				currentParent = '';
			} else {
				// We have the parent page id, we need to display its name.
				const currentParentFromItems = items && items.find( ( item ) => {
					return item.id === parent;
				} );

				// Set or fetch the current author.
				if ( currentParentFromItems ) {
					this.setState( {
						parentPost: parent,
					} );
				} else {
					this.getCurrentParentFromAPI( parent );
				}
			}
		}

		const isHierarchical = get( postType, [ 'hierarchical' ], false );
		const parentPageLabel = get( postType, [ 'labels', 'parent_item_colon' ] );
		const pageItems = items || [];
		if ( ! isHierarchical || ! parentPageLabel || ! pageItems.length ) {
			return null;
		}

		if ( false === currentParent ) {
			currentParent = parentPost && parentPost.title.rendered ?
				`${ parentPost.title.rendered } (#${ parentPost.id })` :
				`${ __( 'no title' ) } (#${ parentPost.id })`;
		}

		if ( items.length > 99 ) {
			return (
				<>
					<label htmlFor={ parent }>{ __( 'Parent Page' ) }</label>
					<Autocomplete
						id={ parent }
						minLength={ 2 }
						showAllValues={ true }
						defaultValue={ currentParent ? currentParent : '' }
						displayMenu="overlay"
						onConfirm={ this.handleSelection }
						source={ this.suggestPage }
						showNoOptionsFound={ false }
						preserveNullOptions={ true }
						tStatusQueryTooShort={ ( minQueryLength ) =>
							// translators: %d: the number characters required to initiate a page search.
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
						cssNamespace="components-parent-page__autocomplete"
					/>
				</>
			);
		}

		const pagesTree = buildTermsTree( pageItems.map( ( item ) => ( {
			id: item.id,
			parent: item.parent,
			name: item.title.rendered ? `${ item.title.rendered } (#${ item.id })` : `${ __( 'no title' ) } (#${ item.id })`,
		} ) ) );

		return (
			<TreeSelect
				className="editor-page-attributes__parent"
				label={ parentPageLabel }
				noOptionLabel={ `(${ __( 'no parent' ) })` }
				tree={ pagesTree }
				selectedId={ parent }
				onChange={ onUpdateParent }
			/>
		);
	}
}

const applyWithSelect = withSelect( ( select ) => {
	const { getPostType, getEntityRecords } = select( 'core' );
	const { getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );
	const postTypeSlug = getEditedPostAttribute( 'type' );
	const postType = getPostType( postTypeSlug );
	const postId = getCurrentPostId();
	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const query = {
		per_page: 100,
		exclude: postId,
		parent_exclude: postId,
		orderby: 'menu_order',
		order: 'asc',
	};

	return {
		parent: getEditedPostAttribute( 'parent' ),
		items: isHierarchical ? getEntityRecords( 'postType', postTypeSlug, query ) : [],
		postType,
	};
} );

const applyWithDispatch = withDispatch( ( dispatch ) => {
	const { editPost } = dispatch( 'core/editor' );
	return {
		onUpdateParent( parent ) {
			editPost( { parent: parent || 0 } );
		},
	};
} );

export default compose( [
	applyWithSelect,
	applyWithDispatch,
] )( PageAttributesParent );
