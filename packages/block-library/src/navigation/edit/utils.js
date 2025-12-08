/**
 * External dependencies
 */
import clsx from 'clsx';

function getComputedStyle( node ) {
	return node.ownerDocument.defaultView.getComputedStyle( node );
}

export function detectColors(
	colorsDetectionElement,
	setColor,
	setBackground
) {
	if ( ! colorsDetectionElement ) {
		return;
	}
	setColor( getComputedStyle( colorsDetectionElement ).color );

	let backgroundColorNode = colorsDetectionElement;
	let backgroundColor =
		getComputedStyle( backgroundColorNode ).backgroundColor;
	while (
		backgroundColor === 'rgba(0, 0, 0, 0)' &&
		backgroundColorNode.parentNode &&
		backgroundColorNode.parentNode.nodeType ===
			backgroundColorNode.parentNode.ELEMENT_NODE
	) {
		backgroundColorNode = backgroundColorNode.parentNode;
		backgroundColor =
			getComputedStyle( backgroundColorNode ).backgroundColor;
	}

	setBackground( backgroundColor );
}

/**
 * Determine the colors for a menu.
 *
 * Order of priority is:
 * 1: Submenu custom colors (if submenu, new blocks)
 * 2: Submenu theme colors (if submenu, new blocks)
 * 3: Overlay custom colors (if submenu, legacy fallback)
 * 4: Overlay theme colors (if submenu, legacy fallback)
 * 5: Custom colors
 * 6: Theme colors
 * 7: Global styles
 *
 * @param {Object}  context
 * @param {boolean} isSubMenu
 */
export function getColors( context, isSubMenu ) {
	const {
		textColor,
		customTextColor,
		backgroundColor,
		customBackgroundColor,
		overlayTextColor,
		customOverlayTextColor,
		overlayBackgroundColor,
		customOverlayBackgroundColor,
		submenuTextColor,
		customSubmenuTextColor,
		submenuBackgroundColor,
		customSubmenuBackgroundColor,
		style,
	} = context;

	const colors = {};

	// Text color priority: submenu colors first, then overlay (legacy), then main colors.
	// Check for submenu colors first (new blocks), then fall back to overlay (legacy).
	if ( isSubMenu ) {
		if ( customSubmenuTextColor ) {
			colors.customTextColor = customSubmenuTextColor;
		} else if ( submenuTextColor ) {
			colors.textColor = submenuTextColor;
		} else if ( customOverlayTextColor ) {
			colors.customTextColor = customOverlayTextColor;
		} else if ( overlayTextColor ) {
			colors.textColor = overlayTextColor;
		} else if ( customTextColor ) {
			colors.customTextColor = customTextColor;
		} else if ( textColor ) {
			colors.textColor = textColor;
		} else if ( style?.color?.text ) {
			colors.customTextColor = style.color.text;
		}
	} else if ( customTextColor ) {
		// Not a submenu, use main colors.
		colors.customTextColor = customTextColor;
	} else if ( textColor ) {
		colors.textColor = textColor;
	} else if ( style?.color?.text ) {
		colors.customTextColor = style.color.text;
	}

	// Background color priority: submenu colors first, then overlay (legacy), then main colors.
	// Check for submenu colors first (new blocks), then fall back to overlay (legacy).
	if ( isSubMenu ) {
		if ( customSubmenuBackgroundColor ) {
			colors.customBackgroundColor = customSubmenuBackgroundColor;
		} else if ( submenuBackgroundColor ) {
			colors.backgroundColor = submenuBackgroundColor;
		} else if ( customOverlayBackgroundColor ) {
			colors.customBackgroundColor = customOverlayBackgroundColor;
		} else if ( overlayBackgroundColor ) {
			colors.backgroundColor = overlayBackgroundColor;
		} else if ( customBackgroundColor ) {
			colors.customBackgroundColor = customBackgroundColor;
		} else if ( backgroundColor ) {
			colors.backgroundColor = backgroundColor;
		} else if ( style?.color?.background ) {
			colors.customBackgroundColor = style.color.background;
		}
	} else if ( customBackgroundColor ) {
		// Not a submenu, use main colors.
		colors.customBackgroundColor = customBackgroundColor;
	} else if ( backgroundColor ) {
		colors.backgroundColor = backgroundColor;
	} else if ( style?.color?.background ) {
		colors.customBackgroundColor = style.color.background;
	}

	return colors;
}

export function getNavigationChildBlockProps( innerBlocksColors ) {
	return {
		className: clsx( 'wp-block-navigation__submenu-container', {
			'has-text-color': !! (
				innerBlocksColors.textColor || innerBlocksColors.customTextColor
			),
			[ `has-${ innerBlocksColors.textColor }-color` ]:
				!! innerBlocksColors.textColor,
			'has-background': !! (
				innerBlocksColors.backgroundColor ||
				innerBlocksColors.customBackgroundColor
			),
			[ `has-${ innerBlocksColors.backgroundColor }-background-color` ]:
				!! innerBlocksColors.backgroundColor,
		} ),
		style: {
			color: innerBlocksColors.customTextColor,
			backgroundColor: innerBlocksColors.customBackgroundColor,
		},
	};
}
