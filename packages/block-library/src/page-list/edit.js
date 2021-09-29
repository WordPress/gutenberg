/**
 * External dependencies
 */
import classnames from 'classnames';
import { sortBy } from 'lodash';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	getColorClassName,
	InspectorControls,
} from '@wordpress/block-editor';
import { ToolbarButton, Placeholder, Spinner } from '@wordpress/components';
import { PanelBody, ToggleControl, ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState, memo } from '@wordpress/element';
import apiFetch from '@wordpress/api-fetch';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';
import { ItemSubmenuIcon } from '../navigation-link/icons';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

export default function PageListEdit( { context, clientId } ) {
	const { pagesByParentId, totalPages } = usePagesByParentId();

	const isParentBlockNavigation = useSelect(
		( select ) => {
			const { getBlockParentsByBlockName } = select( blockEditorStore );
			return (
				getBlockParentsByBlockName( clientId, 'core/navigation' )
					.length > 0
			);
		},
		[ clientId ]
	);

	const showChildPageToggle = useSelect( ( select ) => {
		const { getCurrentPostType } = select( editorStore );
		const currentPostType = getCurrentPostType();
		const allowedTypes = [ 'page', 'wp_template' ];
		return allowedTypes.includes( currentPostType );
	} );

	useEffect( () => {
		setAttributes( {
			isNavigationChild: isParentBlockNavigation,
			openSubmenusOnClick: !! context.openSubmenusOnClick,
			showSubmenuIcon: !! context.showSubmenuIcon,
		} );
	}, [ context.openSubmenusOnClick, context.showSubmenuIcon ] );

	useEffect( () => {
		if ( isParentBlockNavigation ) {
			apiFetch( {
				path: addQueryArgs( '/wp/v2/pages', {
					per_page: 1,
					_fields: [ 'id' ],
				} ),
				parse: false,
			} ).then( ( res ) => {
				setAllowConvertToLinks(
					res.headers.get( 'X-WP-Total' ) <= MAX_PAGE_COUNT
				);
			} );
		} else {
			setAllowConvertToLinks( false );
		}
	}, [ isParentBlockNavigation ] );

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	// Update parent status before component first renders.
	const attributesWithParentBlockStatus = {
		...attributes,
		isNavigationChild: isParentBlockNavigation,
		openSubmenusOnClick: !! context.openSubmenusOnClick,
		showSubmenuIcon: !! context.showSubmenuIcon,
	};

	return (
		<>
			<InspectorControls>
				{ showChildPageToggle && (
					<PanelBody>
						<ToggleControl
							label={ __( 'Limit to child pages' ) }
							checked={ !! attributes.showOnlyChildPages }
							onChange={ () =>
								setAttributes( {
									showOnlyChildPages: ! attributes.showOnlyChildPages,
								} )
							}
							help={ __(
								'When enabled, the block lists only child pages of the current page.'
							) }
						/>
					</PanelBody>
				) }
			</InspectorControls>
			{ allowConvertToLinks && (
				<BlockControls group="other">
					<ToolbarButton title={ __( 'Edit' ) } onClick={ openModal }>
						{ __( 'Edit' ) }
					</ToolbarButton>
				</BlockControls>
			) }
			{ allowConvertToLinks && isOpen && (
				<ConvertToLinksModal
					onClose={ closeModal }
					clientId={ clientId }
				/>
			) }
			<div { ...blockProps }>
				<ServerSideRender
					block="core/page-list"
					attributes={ attributesWithParentBlockStatus }
					EmptyResponsePlaceholder={ () => (
						<span>{ __( 'Page List: No pages to show.' ) }</span>
					) }
				/>
			</div>
		</>
	);
}

function usePagesByParentId() {
	const [ pagesByParentId, setPagesByParentId ] = useState( null );
	const [ totalPages, setTotalPages ] = useState( null );

	useEffect( () => {
		async function performFetch() {
			setPagesByParentId( null );
			setTotalPages( null );

			let pages = await apiFetch( {
				path: addQueryArgs( '/wp/v2/pages', {
					orderby: 'menu_order',
					order: 'asc',
					_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
					per_page: -1,
				} ),
			} );

			// TODO: Once the REST API supports passing multiple values to
			// 'orderby', this can be removed.
			// https://core.trac.wordpress.org/ticket/39037
			pages = sortBy( pages, [ 'menu_order', 'title.rendered' ] );

			setPagesByParentId(
				pages.reduce( ( accumulator, page ) => {
					const { parent } = page;
					if ( accumulator.has( parent ) ) {
						accumulator.get( parent ).push( page );
					} else {
						accumulator.set( parent, [ page ] );
					}
					return accumulator;
				}, new Map() )
			);
			setTotalPages( pages.length );
		}
		performFetch();
	}, [] );

	return {
		pagesByParentId,
		totalPages,
	};
}

const PageItems = memo( function PageItems( {
	context,
	pagesByParentId,
	parentId = 0,
	depth = 0,
} ) {
	const pages = pagesByParentId.get( parentId );

	if ( ! pages?.length ) {
		return [];
	}

	return pages.map( ( page ) => {
		const hasChildren = pagesByParentId.has( page.id );
		const isNavigationChild = 'showSubmenuIcon' in context;
		return (
			<li
				key={ page.id }
				className={ classnames( 'wp-block-pages-list__item', {
					'has-child': hasChildren,
					'wp-block-navigation-item': isNavigationChild,
					'open-on-click': context.openSubmenusOnClick,
					'open-on-hover-click':
						! context.openSubmenusOnClick &&
						context.showSubmenuIcon,
				} ) }
			>
				{ hasChildren && context.openSubmenusOnClick ? (
					<ItemSubmenuToggle title={ page.title?.rendered } />
				) : (
					<a
						className={ classnames(
							'wp-block-pages-list__item__link',
							{
								'wp-block-navigation-item__content': isNavigationChild,
							}
						) }
						href={ page.link }
					>
						{ page.title?.rendered }
					</a>
				) }
				{ hasChildren && (
					<>
						{ ! context.openSubmenusOnClick &&
							context.showSubmenuIcon && <ItemSubmenuToggle /> }
						<ul
							className={ classnames( 'submenu-container', {
								'wp-block-navigation__submenu-container': isNavigationChild,
							} ) }
						>
							<PageItems
								context={ context }
								pagesByParentId={ pagesByParentId }
								parentId={ page.id }
								depth={ depth + 1 }
							/>
						</ul>
					</>
				) }
			</li>
		);
	} );
} );

function ItemSubmenuToggle( { title } ) {
	return (
		<button
			className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
			aria-expanded="false"
		>
			{ title }
			<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
				<ItemSubmenuIcon />
			</span>
		</button>
	);
}
