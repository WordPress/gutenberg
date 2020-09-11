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

export function PageAttributesParent() {
	const { editPost } = useDispatch( 'core/editor' );
	const [ fieldValue, setFieldValue ] = useState();
	const { isLoading, parent, items, postType, parents } = useSelect(
		( select ) => {
			const { getPostType, getEntityRecords, isResolving } = select(
				'core'
			);
			const { getCurrentPostId, getEditedPostAttribute } = select(
				'core/editor'
			);
			const postTypeSlug = getEditedPostAttribute( 'type' );
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
			if (
				! fieldValue ||
				'' === fieldValue ||
				fieldValue === parent?.name
			) {
				query.search = fieldValue;
			}
			const par = getEditedPostAttribute( 'parent' );
			const pars = getEntityRecords( 'postType', postTypeSlug, {
				include: [ par ],
			} );

			return {
				parent: par,
				items: isHierarchical
					? getEntityRecords( 'postType', postTypeSlug, query )
					: [],
				postType: pType,
				isLoading: isResolving( 'postType', postTypeSlug, query ),
				parents: pars,
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
				key: treeNode.id,
				name:
					repeat( '\u00A0', level * 3 ) +
					unescapeString( treeNode.name ),
			},
			...getOptionsFromTree( treeNode.children || [], level + 1 ),
		] );
	};

	const parentOptions = useMemo( () => {
		const tree = buildTermsTree(
			pageItems.map( ( item ) => ( {
				id: item.id,
				parent: item.parent,
				name:
					item.title && item.title.raw
						? item.title.raw
						: `#${ item.id } (${ __( 'no title' ) })`,
			} ) )
		);
		const opts = getOptionsFromTree( tree );

		// Ensure the current page is included in the dropdown list.
		const foundParent = opts.findIndex( ( { key } ) => parent === key );
		if ( foundParent < 0 && parentPost ) {
			return [ { key: parentPost.id, name: parentPost.title }, ...opts ];
		}
		return opts;
	}, [ parent, parentPost, pageItems ] );
	//console.log( parentOptions );

	if ( ! isHierarchical || ! parentPageLabel ) {
		return null;
	}
	/**
	 * Handle user input.
	 *
	 * @param {string} inputValue The current value of the input field.
	 */
	const handleKeydown = ( { inputValue } ) => {
		setFieldValue( inputValue );
	};

	/**
	 * Handle author selection.
	 *
	 * @param {Object} value The selected Author.
	 * @param {Object} value.selectedItem The selected Author.
	 */
	const handleChange = ( { selectedItem } ) => {
		if ( ! selectedItem ) {
			return;
		}
		setFieldValue( selectedItem.name );
		editPost( { parent: selectedItem.key } );
	};

	const parentPost = parents ? parents[ 0 ] : false;
	const inputValue = parentPost?.title?.raw;
	const initialSelectedItem = {
		key: parentPost?.id,
		name: inputValue,
	};
	return (
		<ComboboxControl
			className="editor-page-attributes__parent"
			label={ parentPageLabel }
			options={ parentOptions }
			initialInputValue={ inputValue }
			onInputValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleChange }
			initialSelectedItem={ initialSelectedItem }
			isLoading={ isLoading }
		/>
	);
}

export default PageAttributesParent;
