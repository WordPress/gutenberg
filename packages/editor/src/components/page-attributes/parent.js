/**
 * External dependencies
 */
import { get } from 'lodash';
import httpBuildQuery from 'http-build-query';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TreeSelect, withAPIData } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

export function PageAttributesParent( { parent, postType, items, onUpdateParent } ) {
	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const parentPageLabel = get( postType, [ 'labels', 'parent_item_colon' ] );
	const pageItems = get( items, [ 'data' ], [] );
	if ( ! isHierarchical || ! parentPageLabel || ! pageItems.length ) {
		return null;
	}

	const pagesTree = buildTermsTree( pageItems.map( ( item ) => ( {
		id: item.id,
		parent: item.parent,
		name: item.title.raw ? item.title.raw : `#${ item.id } (${ __( 'no title' ) })`,
	} ) ) );
	return (
		<TreeSelect
			label={ parentPageLabel }
			noOptionLabel={ `(${ __( 'no parent' ) })` }
			tree={ pagesTree }
			selectedId={ parent }
			onChange={ onUpdateParent }
		/>
	);
}

const applyWithSelect = withSelect( ( select ) => {
	const { getPostType } = select( 'core' );
	const { getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );
	const postTypeSlug = getEditedPostAttribute( 'type' );
	return {
		postId: getCurrentPostId(),
		parent: getEditedPostAttribute( 'parent' ),
		postType: getPostType( postTypeSlug ),
		postTypeSlug,
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

const applyWithAPIDataItems = withAPIData( ( { postType, postId } ) => {
	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const restBase = get( postType, [ 'rest_base' ], false );
	const queryString = httpBuildQuery( {
		context: 'edit',
		per_page: -1,
		exclude: postId,
		parent_exclude: postId,
		_fields: [ 'id', 'parent', 'title' ],
		orderby: 'menu_order',
		order: 'asc',
	} );
	return isHierarchical && restBase ?
		{ items: `/wp/v2/${ restBase }?${ queryString }` } :
		{};
} );

export default compose( [
	applyWithSelect,
	applyWithDispatch,
	applyWithAPIDataItems,
] )( PageAttributesParent );
