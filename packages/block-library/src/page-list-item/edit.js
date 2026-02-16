/**
 * External dependencies
 */
import clsx from 'clsx';
/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';
import { RawHTML } from '@wordpress/element';
import { safeHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from '../navigation-link/icons';
import {
	getColors,
	getNavigationChildBlockProps,
} from '../navigation/edit/utils';

function useFrontPageId() {
	return useSelect( ( select ) => {
		const canReadSettings = select( coreStore ).canUser( 'read', {
			kind: 'root',
			name: 'site',
		} );
		if ( ! canReadSettings ) {
			return undefined;
		}

		const site = select( coreStore ).getEntityRecord( 'root', 'site' );
		return site?.show_on_front === 'page' && site?.page_on_front;
	}, [] );
}

export default function PageListItemEdit( { context, attributes } ) {
	const { id, label, link, hasChildren, title } = attributes;
	const isNavigationChild = 'showSubmenuIcon' in context;
	const frontPageId = useFrontPageId();

	// Get submenu visibility from context. The Navigation block handles
	// backward compatibility by migrating openSubmenusOnClick to submenuVisibility
	// via its deprecation handler before this context is received.
	const submenuVisibility = context.submenuVisibility;

	const openOnClick = submenuVisibility === 'click';

	const innerBlocksColors = getColors( context, true );

	const navigationChildBlockProps =
		getNavigationChildBlockProps( innerBlocksColors );
	const blockProps = useBlockProps( navigationChildBlockProps, {
		className: 'wp-block-pages-list__item',
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps );

	return (
		<li
			key={ id }
			className={ clsx( 'wp-block-pages-list__item', {
				'has-child': hasChildren,
				'wp-block-navigation-item': isNavigationChild,
				// Class assignment logic matches PHP rendering in page-list/index.php
				'open-on-click': openOnClick,
				'open-always': submenuVisibility === 'always',
				// Must check hover mode explicitly to match PHP elseif structure (index.php:212)
				'open-on-hover-click':
					submenuVisibility === 'hover' && context.showSubmenuIcon,
				'menu-item-home': id === frontPageId,
			} ) }
		>
			{ hasChildren && openOnClick ? (
				<>
					<button
						type="button"
						className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
						aria-expanded="false"
					>
						<RawHTML>{ safeHTML( label ) }</RawHTML>
					</button>
					<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				</>
			) : (
				<a
					className={ clsx( 'wp-block-pages-list__item__link', {
						'wp-block-navigation-item__content': isNavigationChild,
					} ) }
					href={ link }
				>
					<RawHTML>{ safeHTML( title ) }</RawHTML>
				</a>
			) }
			{ hasChildren && (
				<>
					{ ! openOnClick && context.showSubmenuIcon && (
						<button
							className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon"
							aria-expanded="false"
							type="button"
						>
							<ItemSubmenuIcon />
						</button>
					) }
					<ul { ...innerBlocksProps }></ul>
				</>
			) }
		</li>
	);
}
