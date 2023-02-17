/**
 * External dependencies
 */
import { get } from 'lodash';
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { ComboboxControl } from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import { useState, useMemo } from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { buildTermsTree } from '../../utils/terms';
import { store as editorStore } from '../../store';

function getTitle( post ) {
	return post?.title?.rendered
		? decodeEntities( post.title.rendered )
		: `#${ post.id } (${ __( 'no title' ) })`;
}

export const getItemPriority = ( name, searchValue ) => {
	const normalizedName = removeAccents( name || '' ).toLowerCase();
	const normalizedSearch = removeAccents( searchValue || '' ).toLowerCase();
	if ( normalizedName === normalizedSearch ) {
		return 0;
	}

	if ( normalizedName.startsWith( normalizedSearch ) ) {
		return normalizedName.length;
	}

	return Infinity;
};

export function PageAttributesParent() {
	const { editPost } = useDispatch( editorStore );
	const [ fieldValue, setFieldValue ] = useState( false );
	const { parentPost, parentPostId, items, postType } = useSelect(
		( select ) => {
			const { getPostType, getEntityRecords, getEntityRecord } =
				select( coreStore );
			const { getCurrentPostId, getEditedPostAttribute } =
				select( editorStore );
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

			// Perform a search when the field is changed.
			if ( !! fieldValue ) {
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

	const parentOptions = useMemo( () => {
		const getOptionsFromTree = ( tree, level = 0 ) => {
			const mappedNodes = tree.map( ( treeNode ) => [
				{
					value: treeNode.id,
					label:
						'— '.repeat( level ) + decodeEntities( treeNode.name ),
					rawName: treeNode.name,
				},
				...getOptionsFromTree( treeNode.children || [], level + 1 ),
			] );

			const sortedNodes = mappedNodes.sort( ( [ a ], [ b ] ) => {
				const priorityA = getItemPriority( a.rawName, fieldValue );
				const priorityB = getItemPriority( b.rawName, fieldValue );
				return priorityA >= priorityB ? 1 : -1;
			} );

			return sortedNodes.flat();
		};

		let tree = pageItems.map( ( item ) => ( {
			id: item.id,
			parent: item.parent,
			name: getTitle( item ),
		} ) );

		// Only build a hierarchical tree when not searching.
		if ( ! fieldValue ) {
			tree = buildTermsTree( tree );
		}

		const opts = getOptionsFromTree( tree );

		// Ensure the current parent is in the options list.
		const optsHasParent = opts.find(
			( item ) => item.value === parentPostId
		);
		if ( parentPost && ! optsHasParent ) {
			opts.unshift( {
				value: parentPostId,
				label: getTitle( parentPost ),
			} );
		}
		return opts;
	}, [ pageItems, fieldValue ] );

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
			__nextHasNoMarginBottom
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
