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
} from '@wordpress/block-editor';
import { ToolbarButton, Placeholder, Spinner } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useMemo, useState, memo } from '@wordpress/element';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import ConvertToLinksModal from './convert-to-links-modal';
import { ItemSubmenuIcon } from '../navigation-link/icons';

// We only show the edit option when page count is <= MAX_PAGE_COUNT
// Performance of Navigation Links is not good past this value.
const MAX_PAGE_COUNT = 100;

export default function PageListEdit( { context, clientId } ) {
	const { pagesByParentId, totalPages } = usePageData();

	const isNavigationChild = 'showSubmenuIcon' in context;
	const allowConvertToLinks =
		isNavigationChild && totalPages <= MAX_PAGE_COUNT;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	const blockProps = useBlockProps( {
		className: classnames( 'wp-block-page-list', {
			'has-text-color': !! context.textColor,
			[ getColorClassName(
				'color',
				context.textColor
			) ]: !! context.textColor,
			'has-background': !! context.backgroundColor,
			[ getColorClassName(
				'background-color',
				context.backgroundColor
			) ]: !! context.backgroundColor,
		} ),
		style: { ...context.style?.color },
	} );

	return (
		<>
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
			{ totalPages === undefined && (
				<div { ...blockProps }>
					<Placeholder>
						<Spinner />
					</Placeholder>
				</div>
			) }
			{ totalPages === 0 && (
				<div { ...blockProps }>
					<span>{ __( 'Page List: No pages to show.' ) }</span>
				</div>
			) }
			{ totalPages > 0 && (
				<ul { ...blockProps }>
					<PageItems
						context={ context }
						pagesByParentId={ pagesByParentId }
					/>
				</ul>
			) }
		</>
	);
}

function useFrontPageId() {
	return useSelect( ( select ) => {
		const site = select( coreStore ).getEntityRecord( 'root', 'site' );
		return site?.show_on_front === 'page' && site?.page_on_front;
	}, [] );
}

function usePageData() {
	const { pages } = useSelect( ( select ) => {
		const { getEntityRecords } = select( coreStore );

		return {
			pages: getEntityRecords( 'postType', 'page', {
				orderby: 'menu_order',
				order: 'asc',
				_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
				per_page: -1,
			} ),
		};
	}, [] );

	return useMemo( () => {
		// TODO: Once the REST API supports passing multiple values to
		// 'orderby', this can be removed.
		// https://core.trac.wordpress.org/ticket/39037
		const sortedPages = sortBy( pages, [ 'menu_order', 'title.rendered' ] );
		const pagesByParentId = sortedPages.reduce( ( accumulator, page ) => {
			const { parent } = page;
			if ( accumulator.has( parent ) ) {
				accumulator.get( parent ).push( page );
			} else {
				accumulator.set( parent, [ page ] );
			}
			return accumulator;
		}, new Map() );

		return {
			pagesByParentId,
			totalPages: pages?.length,
		};
	}, [ pages ] );
}

const PageItems = memo( function PageItems( {
	context,
	pagesByParentId,
	parentId = 0,
	depth = 0,
} ) {
	const pages = pagesByParentId.get( parentId );
	const frontPageId = useFrontPageId();

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
					'menu-item-home': page.id === frontPageId,
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
