/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { TreeSelect } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withSelect, withDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

export function PageAttributesParent( { parent, postType, items, onUpdateParent } ) {
	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const parentPageLabel = get( postType, [ 'labels', 'parent_item_colon' ] );
	const pageItems = items || [];
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
			className="editor-page-attributes__parent"
			label={ parentPageLabel }
			noOptionLabel={ `(${ __( 'no parent' ) })` }
			tree={ pagesTree }
			selectedId={ parent }
			onChange={ onUpdateParent }
		/>
	);
}

const applyWithSelect = withSelect( ( select, ownProps ) => {
	const { getPostType, getEntityRecords } = select( 'core' );
	const { getCurrentPostId, getEditedPostAttribute } = select( 'core/editor' );
	const postTypeSlug = getEditedPostAttribute( 'type' );
	const postType = getPostType( postTypeSlug );
	let items;
	if ( ownProps.items ) {
		items = ownProps.items;
	} else {
		const postId = getCurrentPostId();
		const isHierarchical = get( postType, [ 'hierarchical' ], false );
		const query = {
			per_page: -1,
			exclude: postId,
			parent_exclude: postId,
			orderby: 'menu_order',
			order: 'asc',
		};
		items = isHierarchical ?
			getEntityRecords( 'postType', postTypeSlug, query ) :
			[];
	}

	return {
		parent: getEditedPostAttribute( 'parent' ),
		items,
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
