/**
 * External dependencies
 */
import clsx from 'clsx';
import { paramCase as kebabCase } from 'change-case';

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
 * 1: Overlay custom colors (if submenu)
 * 2: Overlay theme colors (if submenu)
 * 3: Custom colors
 * 4: Theme colors
 * 5: Global styles
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

/**
 * Return a unique template part title based on
 * the given title and existing template parts.
 *
 * This implementation is copied from:
 * packages/fields/src/components/create-template-part-modal/utils.js
 *
 * @param {string} title         The original template part title.
 * @param {Object} templateParts The array of template part entities.
 * @return {string} A unique template part title.
 */
export const getUniqueTemplatePartTitle = ( title, templateParts ) => {
	const lowercaseTitle = title.toLowerCase();
	const existingTitles = templateParts.map( ( templatePart ) =>
		templatePart.title.rendered.toLowerCase()
	);

	if ( ! existingTitles.includes( lowercaseTitle ) ) {
		return title;
	}

	let suffix = 2;
	while ( existingTitles.includes( `${ lowercaseTitle } ${ suffix }` ) ) {
		suffix++;
	}

	return `${ title } ${ suffix }`;
};

/**
 * Get a valid slug for a template part.
 * Currently template parts only allow latin chars.
 * The fallback slug will receive suffix by default.
 *
 * This implementation is copied from:
 * packages/fields/src/components/create-template-part-modal/utils.js
 *
 * @param {string} title The template part title.
 * @return {string} A valid template part slug.
 */
export const getCleanTemplatePartSlug = ( title ) => {
	return kebabCase( title ).replace( /[^\w-]+/g, '' ) || 'wp-custom-part';
};
