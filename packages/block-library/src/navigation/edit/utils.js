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
 * 3: Default overlay custom colors (if submenu, legacy fallback)
 * 4: Default overlay theme colors (if submenu, legacy fallback)
 * 5: Legacy overlay custom colors (if submenu, unmigrated blocks fallback)
 * 6: Legacy overlay theme colors (if submenu, unmigrated blocks fallback)
 * 7: Custom colors
 * 8: Theme colors
 * 9: Global styles
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
		// New overlay color attributes (defaultOverlay*).
		defaultOverlayTextColor,
		customDefaultOverlayTextColor,
		defaultOverlayBackgroundColor,
		customDefaultOverlayBackgroundColor,
		// Legacy overlay color attributes (overlay*) - for backwards compatibility with unmigrated blocks.
		overlayTextColor,
		customOverlayTextColor,
		overlayBackgroundColor,
		customOverlayBackgroundColor,
		// Submenu color attributes.
		submenuTextColor,
		customSubmenuTextColor,
		submenuBackgroundColor,
		customSubmenuBackgroundColor,
		style,
	} = context;

	const colors = {};

	// Text color priority: submenu colors first, then legacy overlay colors (unmigrated only), then main colors.
	// Check for submenu colors first. Only fall back to overlay colors for truly legacy blocks
	// (those with legacy overlay colors but not new overlay colors). Migrated/new blocks that
	// have new overlay colors should NOT fall back when submenu colors are cleared.
	if ( isSubMenu ) {
		if ( customSubmenuTextColor ) {
			colors.customTextColor = customSubmenuTextColor;
		} else if ( submenuTextColor ) {
			colors.textColor = submenuTextColor;
		} else if (
			// Only fall back to legacy overlay colors for unmigrated blocks.
			// If new overlay colors exist, this is a migrated/new block and we should NOT fall back.
			! defaultOverlayTextColor &&
			! customDefaultOverlayTextColor &&
			customOverlayTextColor
		) {
			// Fallback to legacy overlay colors (unmigrated blocks only).
			colors.customTextColor = customOverlayTextColor;
		} else if (
			! defaultOverlayTextColor &&
			! customDefaultOverlayTextColor &&
			overlayTextColor
		) {
			// Fallback to legacy overlay colors (unmigrated blocks only).
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

	// Background color priority: submenu colors first, then legacy overlay colors (unmigrated only), then main colors.
	// Check for submenu colors first. Only fall back to overlay colors for truly legacy blocks
	// (those with legacy overlay colors but not new overlay colors). Migrated/new blocks that
	// have new overlay colors should NOT fall back when submenu colors are cleared.
	if ( isSubMenu ) {
		if ( customSubmenuBackgroundColor ) {
			colors.customBackgroundColor = customSubmenuBackgroundColor;
		} else if ( submenuBackgroundColor ) {
			colors.backgroundColor = submenuBackgroundColor;
		} else if (
			// Only fall back to legacy overlay colors for unmigrated blocks.
			// If new overlay colors exist, this is a migrated/new block and we should NOT fall back.
			! defaultOverlayBackgroundColor &&
			! customDefaultOverlayBackgroundColor &&
			customOverlayBackgroundColor
		) {
			// Fallback to legacy overlay colors (unmigrated blocks only).
			colors.customBackgroundColor = customOverlayBackgroundColor;
		} else if (
			! defaultOverlayBackgroundColor &&
			! customDefaultOverlayBackgroundColor &&
			overlayBackgroundColor
		) {
			// Fallback to legacy overlay colors (unmigrated blocks only).
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
