/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * Internal dependencies
 */
import ContrastCheckerMessage from './contrast-checker-message';

extend( [ namesPlugin, a11yPlugin ] );

function ContrastChecker( {
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	fallbackLinkColor,
	fontSize, // font size value in pixels
	isLargeText,
	textColor,
	linkColor,
	enableAlphaChecker = false,
} ) {
	const currentBackgroundColor = backgroundColor || fallbackBackgroundColor;

	// Must have a background color.
	if ( ! currentBackgroundColor ) {
		return null;
	}

	const currentTextColor = textColor || fallbackTextColor;
	const currentLinkColor = linkColor || fallbackLinkColor;

	// Must have at least one text color.
	if ( ! currentTextColor && ! currentLinkColor ) {
		return null;
	}

	const colordBackgroundColor = colord( currentBackgroundColor );
	const backgroundColorHasTransparency = colordBackgroundColor.alpha() < 1;

	const hasTextAndLinkColors = currentTextColor && currentLinkColor;
	// If there's only one color passed, store in `singleTextColor`.
	const singleTextColor = hasTextAndLinkColors
		? null
		: currentTextColor || currentLinkColor;

	const colordTextColor = singleTextColor
		? colord( singleTextColor )
		: colord( currentTextColor );
	const colordLinkColor = colord( currentLinkColor );

	// Transparency.
	const textColorHasTransparency =
		currentTextColor && colordTextColor.alpha() < 1;
	const linkColorHasTransparency =
		currentLinkColor && colordLinkColor.alpha() < 1;

	// Text size.
	const textSize =
		isLargeText || ( isLargeText !== false && fontSize >= 24 )
			? 'large'
			: 'small';

	// Readability.
	const isTextColorReadable =
		currentTextColor &&
		colordTextColor.isReadable( colordBackgroundColor, {
			level: 'AA',
			size: textSize,
		} );

	const isLinkColorReadable =
		currentLinkColor &&
		colordLinkColor.isReadable( colordBackgroundColor, {
			level: 'AA',
			size: textSize,
		} );

	// Flag to warn about transparency only if the text is otherwise readable according to colord
	// to ensure the readability warnings take precedence.
	let shouldShowTransparencyWarning = false;

	// Don't show the message if the text is readable AND there's no transparency.
	// This is the default.
	if ( ! textColorHasTransparency && ! linkColorHasTransparency ) {
		// If the background has transparency, don't show any contrast warnings.
		if (
			backgroundColorHasTransparency ||
			( isTextColorReadable && isLinkColorReadable ) ||
			( singleTextColor && isTextColorReadable )
		) {
			return null;
		}
	} else {
		// If there's text transparency, don't show the message if the alpha checker is disabled.
		if ( ! enableAlphaChecker ) {
			return null;
		}

		// If the background has transparency, don't show any contrast warnings.
		// If both text colors are readable, but transparent show the warning.
		if (
			backgroundColorHasTransparency ||
			( isTextColorReadable && isLinkColorReadable )
		) {
			shouldShowTransparencyWarning = true;
		}

		// If there is only one text color (text or link) and the color is readable with no transparency.
		if ( singleTextColor && isTextColorReadable ) {
			if ( ! textColorHasTransparency ) {
				return null;
			}
			shouldShowTransparencyWarning = true;
		}
	}

	return (
		<ContrastCheckerMessage
			backgroundColor={ backgroundColor }
			textColor={ textColor }
			linkColor={ linkColor }
			colordBackgroundColor={ colordBackgroundColor }
			colordTextColor={ colordTextColor }
			colordLinkColor={ colordLinkColor }
			shouldShowTransparencyWarning={ shouldShowTransparencyWarning }
		/>
	);
}

export default ContrastChecker;
