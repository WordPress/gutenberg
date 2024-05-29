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
import { decodeEntities } from '@wordpress/html-entities';

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
		const canReadSettings = select( coreStore ).canUser(
			'read',
			'settings'
		);
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
				'open-on-click': context.openSubmenusOnClick,
				'open-on-hover-click':
					! context.openSubmenusOnClick && context.showSubmenuIcon,
				'menu-item-home': id === frontPageId,
			} ) }
		>
			{ hasChildren && context.openSubmenusOnClick ? (
				<>
					<button
						type="button"
						className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
						aria-expanded="false"
					>
						{ decodeEntities( label ) }
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
					{ decodeEntities( title ) }
				</a>
			) }
			{ hasChildren && (
				<>
					{ ! context.openSubmenusOnClick &&
						context.showSubmenuIcon && (
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
