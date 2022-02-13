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
import {
	ToolbarButton,
	Placeholder,
	Spinner,
	Notice,
} from '@wordpress/components';
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
	const { pagesByParentId, totalPages, hasResolvedPages } = usePageData();

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
			{ ! hasResolvedPages && (
				<div { ...blockProps }>
					<Placeholder>
						<Spinner />
					</Placeholder>
				</div>
			) }

			{ hasResolvedPages && totalPages === null && (
				<div { ...blockProps }>
					<div { ...blockProps }>
						<Notice status={ 'warning' } isDismissible={ false }>
							{ __( 'Page List: Cannot retrieve Pages.' ) }
						</Notice>
					</div>
				</div>
			) }

			{ totalPages === 0 && (
				<div { ...blockProps }>
					<Notice status={ 'info' } isDismissible={ false }>
						{ __( 'Page List: Cannot retrieve Pages.' ) }
					</Notice>
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
	const { pages, hasResolvedPages } = useSelect( ( select ) => {
		const { getEntityRecords, hasFinishedResolution } = select( coreStore );

		return {
			pages: getEntityRecords( 'postType', 'page', {
				orderby: 'menu_order',
				order: 'asc',
				_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
				per_page: -1,
			} ),
			hasResolvedPages: hasFinishedResolution( 'getEntityRecords', [
				'postType',
				'page',
				{
					orderby: 'menu_order',
					order: 'asc',
					_fields: [ 'id', 'link', 'parent', 'title', 'menu_order' ],
					per_page: -1,
				},
			] ),
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
			hasResolvedPages,
			totalPages: pages?.length ?? null,
		};
	}, [ pages, hasResolvedPages ] );
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
					<>
						<button
							className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
							aria-expanded="false"
						>
							{ page.title?.rendered }
						</button>
						<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
							<ItemSubmenuIcon />
						</span>
					</>
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
							context.showSubmenuIcon && (
								<button
									className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon"
									aria-expanded="false"
								>
									<ItemSubmenuIcon />
								</button>
							) }
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
