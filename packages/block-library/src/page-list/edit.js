/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import {
	BlockControls,
	useBlockProps,
	getColorClassName,
} from '@wordpress/block-editor';
import { ToolbarButton } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useEffect, useState, useRef } from '@wordpress/element';
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

	const isNavigationChild = 'showSubmenuIcon' in context;
	const allowConvertToLinks =
		isNavigationChild && totalPages <= MAX_PAGE_COUNT;

	const [ isOpen, setOpen ] = useState( false );
	const openModal = () => setOpen( true );
	const closeModal = () => setOpen( false );

	const blockProps = useBlockProps( {
		// TODO: Test that this behaviour matches index.php.
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
			<ul { ...blockProps }>
				<PageItems
					context={ context }
					pagesByParentId={ pagesByParentId }
				/>
			</ul>
		</>
	);
}

function usePagesByParentId() {
	const pagesByParentIdRef = useRef( new Map() );
	const totalPagesRef = useRef( 0 );

	useEffect( () => {
		async function performFetch() {
			const pages = await apiFetch( {
				path: addQueryArgs( '/wp/v2/pages', {
					orderby: 'menu_order',
					order: 'asc',
					_fields: [ 'id', 'link', 'parent', 'title' ],
					per_page: -1,
				} ),
			} );
			pagesByParentIdRef.current = pages.reduce(
				( pagesByParentId, page ) => {
					const { parent } = page;
					if ( pagesByParentId.has( parent ) ) {
						pagesByParentId.get( parent ).push( page );
					} else {
						pagesByParentId.set( parent, [ page ] );
					}
					return pagesByParentId;
				},
				new Map()
			);
			totalPagesRef.current = pages.length;
		}
		performFetch();
	}, [] );

	return {
		pagesByParentId: pagesByParentIdRef.current,
		totalPages: totalPagesRef.current,
	};
}

function PageItems( { context, pagesByParentId, parentId = 0, depth = 0 } ) {
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
					'open-on-click':
						isNavigationChild && context.openSubmenusOnClick,
					'open-on-hover-click':
						isNavigationChild &&
						! context.openSubmenusOnClick &&
						context.showSubmenuIcon,
					// TODO: Overlay classes and styles?
				} ) }
			>
				{ hasChildren &&
				isNavigationChild &&
				context.openSubmenusOnClick ? (
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
						{ isNavigationChild &&
							! context.openSubmenusOnClick &&
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
}

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
