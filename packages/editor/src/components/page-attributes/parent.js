/**
 * External dependencies
 */
import removeAccents from 'remove-accents';

/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import {
	Button,
	Dropdown,
	ComboboxControl,
	ExternalLink,
} from '@wordpress/components';
import { debounce } from '@wordpress/compose';
import {
	createInterpolateElement,
	useState,
	useMemo,
} from '@wordpress/element';
import { useSelect, useDispatch } from '@wordpress/data';
import { decodeEntities } from '@wordpress/html-entities';
import { store as coreStore } from '@wordpress/core-data';
import { __experimentalInspectorPopoverHeader as InspectorPopoverHeader } from '@wordpress/block-editor';
import { filterURLForDisplay } from '@wordpress/url';

/**
 * Internal dependencies
 */
import PostPanelRow from '../post-panel-row';
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

/**
 * Renders the Page Attributes Parent component. A dropdown menu in an editor interface
 * for selecting the parent page of a given page.
 *
 * @return {Component|null} The component to be rendered. Return null if post type is not hierarchical.
 */
export function PageAttributesParent() {
	const { editPost } = useDispatch( editorStore );
	const [ fieldValue, setFieldValue ] = useState( false );
	const { isHierarchical, parentPostId, parentPostTitle, pageItems } =
		useSelect(
			( select ) => {
				const { getPostType, getEntityRecords, getEntityRecord } =
					select( coreStore );
				const { getCurrentPostId, getEditedPostAttribute } =
					select( editorStore );
				const postTypeSlug = getEditedPostAttribute( 'type' );
				const pageId = getEditedPostAttribute( 'parent' );
				const pType = getPostType( postTypeSlug );
				const postId = getCurrentPostId();
				const postIsHierarchical = pType?.hierarchical ?? false;
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

				const parentPost = pageId
					? getEntityRecord( 'postType', postTypeSlug, pageId )
					: null;

				return {
					isHierarchical: postIsHierarchical,
					parentPostId: pageId,
					parentPostTitle: parentPost ? getTitle( parentPost ) : '',
					pageItems: postIsHierarchical
						? getEntityRecords( 'postType', postTypeSlug, query )
						: null,
				};
			},
			[ fieldValue ]
		);

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

		if ( ! pageItems ) {
			return [];
		}

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
		if ( parentPostTitle && ! optsHasParent ) {
			opts.unshift( {
				value: parentPostId,
				label: parentPostTitle,
			} );
		}
		return opts;
	}, [ pageItems, fieldValue, parentPostTitle, parentPostId ] );

	if ( ! isHierarchical ) {
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
			__next40pxDefaultSize
			className="editor-page-attributes__parent"
			label={ __( 'Parent' ) }
			help={ __( 'Choose a parent page.' ) }
			value={ parentPostId }
			options={ parentOptions }
			onFilterValueChange={ debounce( handleKeydown, 300 ) }
			onChange={ handleChange }
			hideLabelFromVision
		/>
	);
}

function PostParentToggle( { isOpen, onClick } ) {
	const parentPost = useSelect( ( select ) => {
		const { getEditedPostAttribute } = select( editorStore );
		const parentPostId = getEditedPostAttribute( 'parent' );
		if ( ! parentPostId ) {
			return null;
		}
		const { getEntityRecord } = select( coreStore );
		const postTypeSlug = getEditedPostAttribute( 'type' );
		return getEntityRecord( 'postType', postTypeSlug, parentPostId );
	}, [] );
	const parentTitle = useMemo(
		() => ( ! parentPost ? __( 'None' ) : getTitle( parentPost ) ),
		[ parentPost ]
	);
	return (
		<Button
			size="compact"
			className="editor-post-parent__panel-toggle"
			variant="tertiary"
			aria-expanded={ isOpen }
			// translators: %s: Current post parent.
			aria-label={ sprintf( __( 'Change parent: %s' ), parentTitle ) }
			onClick={ onClick }
		>
			{ parentTitle }
		</Button>
	);
}

export function ParentRow() {
	const homeUrl = useSelect(
		( select ) => select( coreStore ).getUnstableBase()?.home,
		[]
	);
	// Use internal state instead of a ref to make sure that the component
	// re-renders when the popover's anchor updates.
	const [ popoverAnchor, setPopoverAnchor ] = useState( null );
	// Memoize popoverProps to avoid returning a new object every time.
	const popoverProps = useMemo(
		() => ( {
			// Anchor the popover to the middle of the entire row so that it doesn't
			// move around when the label changes.
			anchor: popoverAnchor,
			placement: 'left-start',
			offset: 36,
			shift: true,
		} ),
		[ popoverAnchor ]
	);
	return (
		<PostPanelRow label={ __( 'Parent' ) } ref={ setPopoverAnchor }>
			<Dropdown
				popoverProps={ popoverProps }
				className="editor-post-parent__panel-dropdown"
				contentClassName="editor-post-parent__panel-dialog"
				focusOnMount
				renderToggle={ ( { isOpen, onToggle } ) => (
					<PostParentToggle isOpen={ isOpen } onClick={ onToggle } />
				) }
				renderContent={ ( { onClose } ) => (
					<div className="editor-post-parent">
						<InspectorPopoverHeader
							title={ __( 'Parent' ) }
							onClose={ onClose }
						/>
						<div>
							{ createInterpolateElement(
								sprintf(
									/* translators: %1$s The home URL of the WordPress installation without the scheme. */
									__(
										'Child pages inherit characteristics from their parent, such as URL structure. For instance, if "Pricing" is a child of "Services", its URL would be %1$s<wbr />/services<wbr />/pricing.'
									),
									filterURLForDisplay( homeUrl ).replace(
										/([/.])/g,
										'<wbr />$1'
									)
								),
								{
									wbr: <wbr />,
								}
							) }
							<p>
								{ __(
									'They also show up as sub-items in the default navigation menu. '
								) }
								<ExternalLink
									href={ __(
										'https://wordpress.org/documentation/article/page-post-settings-sidebar/#page-attributes'
									) }
								>
									{ __( 'Learn more' ) }
								</ExternalLink>
							</p>
						</div>
						<PageAttributesParent />
					</div>
				) }
			/>
		</PostPanelRow>
	);
}

export default PageAttributesParent;
