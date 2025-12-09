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

	// Text color priority: submenu colors first, then new overlay colors, then legacy overlay colors, then main colors.
	// Check for submenu colors first (new blocks), then fall back to overlay (legacy/unmigrated).
	if ( isSubMenu ) {
		if ( customSubmenuTextColor ) {
			colors.customTextColor = customSubmenuTextColor;
		} else if ( submenuTextColor ) {
			colors.textColor = submenuTextColor;
		} else if ( customDefaultOverlayTextColor ) {
			// Fallback to new overlay colors (migrated blocks).
			colors.customTextColor = customDefaultOverlayTextColor;
		} else if ( defaultOverlayTextColor ) {
			// Fallback to new overlay colors (migrated blocks).
			colors.textColor = defaultOverlayTextColor;
		} else if ( customOverlayTextColor ) {
			// Fallback to legacy overlay colors (unmigrated blocks).
			colors.customTextColor = customOverlayTextColor;
		} else if ( overlayTextColor ) {
			// Fallback to legacy overlay colors (unmigrated blocks).
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

	// Background color priority: submenu colors first, then new overlay colors, then legacy overlay colors, then main colors.
	// Check for submenu colors first (new blocks), then fall back to overlay (legacy/unmigrated).
	if ( isSubMenu ) {
		if ( customSubmenuBackgroundColor ) {
			colors.customBackgroundColor = customSubmenuBackgroundColor;
		} else if ( submenuBackgroundColor ) {
			colors.backgroundColor = submenuBackgroundColor;
		} else if ( customDefaultOverlayBackgroundColor ) {
			// Fallback to new overlay colors (migrated blocks).
			colors.customBackgroundColor = customDefaultOverlayBackgroundColor;
		} else if ( defaultOverlayBackgroundColor ) {
			// Fallback to new overlay colors (migrated blocks).
			colors.backgroundColor = defaultOverlayBackgroundColor;
		} else if ( customOverlayBackgroundColor ) {
			// Fallback to legacy overlay colors (unmigrated blocks).
			colors.customBackgroundColor = customOverlayBackgroundColor;
		} else if ( overlayBackgroundColor ) {
			// Fallback to legacy overlay colors (unmigrated blocks).
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
