/**
 * External dependencies
 */
import {
	get,
	unescape as unescapeString,
	debounce,
	flatMap,
	repeat,
} from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { useState, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';

function getTitle( post ) {
	return post?.title?.rendered
		? post.title.rendered
		: `#${ post.id } (${ __( 'no title' ) })`;
}

export function PageAttributesParent() {
	const { editPost } = useDispatch( 'core/editor' );
	const [ fieldValue, setFieldValue ] = useState( false );
	const { parentPost, parentPostId, items, postType } = useSelect(
		( select ) => {
			const { getPostType, getEntityRecords, getEntityRecord } = select(
				'core'
			);
			const { getCurrentPostId, getEditedPostAttribute } = select(
				'core/editor'
			);
			const postTypeSlug = getEditedPostAttribute( 'type' );
			const pageId = getEditedPostAttribute( 'parent' );
			const pType = getPostType( postTypeSlug );
			const postId = getCurrentPostId();
			const isHierarchical = get( pType, [ 'hierarchical' ], false );
			const query = {
				per_page: 100,
				exclude: postId,
				parent_exclude: postId,
				orderby: 'menu_order',
				order: 'asc',
				_fields: 'id,title,parent',
			};
			if ( parentPost && fieldValue && '' !== fieldValue ) {
				query.search = fieldValue;
			}

			return {
				parentPostId: pageId,
				parentPost: pageId
					? getEntityRecord( 'postType', postTypeSlug, pageId )
					: null,
				items: isHierarchical
					? getEntityRecords( 'postType', postTypeSlug, query )
					: [],
				postType: pType,
			};
		},
		[ fieldValue ]
	);

	const isHierarchical = get( postType, [ 'hierarchical' ], false );
	const parentPageLabel = get( postType, [ 'labels', 'parent_item_colon' ] );
	const pageItems = items || [];
	const getOptionsFromTree = ( tree, level = 0 ) => {
		return flatMap( tree, ( treeNode ) => [
			{
				value: treeNode.id,
				label: repeat( '— ', level ) + unescapeString( treeNode.name ),
			},
			...getOptionsFromTree( treeNode.children || [], level + 1 ),
		] );
	};

	const parentOptions = useMemo( () => {
		const tree = buildTermsTree(
			pageItems.map( ( item ) => ( {
				id: item.id,
				parent: item.parent,
				name: getTitle( item ),
			} ) )
		);
		const opts = getOptionsFromTree( tree );

		return opts;
	}, [ pageItems ] );

	if ( ! isHierarchical || ! parentPageLabel ) {
		return null;
	}
	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( inputValue ) => {
		setFieldValue( inputValue );
	};

	/**
	 * Handle author selection.
	 *
	 * @param {Object} selectedPostId The selected Author.
	 */
	const handleChange = ( selectedPostId ) => {
		editPost( { parent: selectedPostId } );
	};

	return (
		<ComboboxControl
			className="editor-page-attributes__parent"
			label={ parentPageLabel }
			value={ parentPostId }
			options={ parentOptions }
			onFilterValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleChange }
		/>
	);
}

export default PageAttributesParent;
