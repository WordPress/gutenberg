/**
 * External dependencies
 */
import classnames from 'classnames';

/**
 * WordPress dependencies
 */
import { useBlockProps, useInnerBlocksProps } from '@wordpress/block-editor';
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

/**
 * Determine the colors for a menu.
 *
 * Order of priority is:
 * 1: Overlay custom colors (if submenu)
 * 2: Overlay theme colors (if submenu)
 * 3: Custom colors
 * 4: Theme colors
 * 5: Global styles
 *
 * @param {Object}  context
 * @param {boolean} isSubMenu
 */
function getColors( context, isSubMenu ) {
	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		overlayTextColor,
		customOverlayTextColor,
		overlayBackgroundColor,
		customOverlayBackgroundColor,
		style,
	} = context;

	const colors = {};

	if ( isSubMenu && !! customOverlayTextColor ) {
		colors.customTextColor = customOverlayTextColor;
	} else if ( isSubMenu && !! overlayTextColor ) {
		colors.textColor = overlayTextColor;
	} else if ( !! customTextColor ) {
		colors.customTextColor = customTextColor;
	} else if ( !! textColor ) {
		colors.textColor = textColor;
	} else if ( !! style?.color?.text ) {
		colors.customTextColor = style.color.text;
	}

	if ( isSubMenu && !! customOverlayBackgroundColor ) {
		colors.customBackgroundColor = customOverlayBackgroundColor;
	} else if ( isSubMenu && !! overlayBackgroundColor ) {
		colors.backgroundColor = overlayBackgroundColor;
	} else if ( !! customBackgroundColor ) {
		colors.customBackgroundColor = customBackgroundColor;
	} else if ( !! backgroundColor ) {
		colors.backgroundColor = backgroundColor;
	} else if ( !! style?.color?.background ) {
		colors.customTextColor = style.color.background;
	}

	return colors;
}

export default function PageListItemEdit( { context, attributes } ) {
	const { id, label, link, hasChildren } = attributes;
	const isNavigationChild = 'showSubmenuIcon' in context;
	const frontPageId = useFrontPageId();

	const innerBlocksColors = getColors( context, true );

	const blockProps = useBlockProps( {
		className: classnames(
			'wp-block-pages-list__item',
			'wp-block-navigation__submenu-container',
			{
				'has-text-color': !! (
					innerBlocksColors.textColor ||
					innerBlocksColors.customTextColor
				),
				[ `has-${ innerBlocksColors.textColor }-color` ]:
					!! innerBlocksColors.textColor,
				'has-background': !! (
					innerBlocksColors.backgroundColor ||
					innerBlocksColors.customBackgroundColor
				),
				[ `has-${ innerBlocksColors.backgroundColor }-background-color` ]:
					!! innerBlocksColors.backgroundColor,
			}
		),
		style: {
			color: innerBlocksColors.customTextColor,
			backgroundColor: innerBlocksColors.customBackgroundColor,
		},
	} );

	const innerBlocksProps = useInnerBlocksProps( blockProps );

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
						{ ...innerBlocksProps }
					></ul>
				</>
			) }
		</li>
	);
}
