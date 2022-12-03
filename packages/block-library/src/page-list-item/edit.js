/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { useSelect } from '@wordpress/data';
import { store as coreStore } from '@wordpress/core-data';

/**
 * Internal dependencies
 */
import { ItemSubmenuIcon } from '../navigation-link/icons';

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
	const { id, label, link, hasChildren } = attributes;
	const isNavigationChild = 'showSubmenuIcon' in context;
	const frontPageId = useFrontPageId();
	return (
		<li
			key={ id }
			className={ classnames( 'wp-block-pages-list__item', {
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
						className="wp-block-navigation-item__content wp-block-navigation-submenu__toggle"
						aria-expanded="false"
					>
						{ label }
					</button>
					<span className="wp-block-page-list__submenu-icon wp-block-navigation__submenu-icon">
						<ItemSubmenuIcon />
					</span>
				</>
			) : (
				<a
					className={ classnames( 'wp-block-pages-list__item__link', {
						'wp-block-navigation-item__content': isNavigationChild,
					} ) }
					href={ link }
				>
					{ label }
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
							'wp-block-navigation__submenu-container':
								isNavigationChild,
						} ) }
					>
						<InnerBlocks />
					</ul>
				</>
			) }
		</li>
	);
}
