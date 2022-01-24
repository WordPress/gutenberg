/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

/**
 * WordPress dependencies
 */
import { speak } from '@wordpress/a11y';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/components';
import { useEffect } from '@wordpress/element';

extend( [ namesPlugin, a11yPlugin ] );

// @TODO move this to an external component.
function ContrastCheckerMessage( {
	colordBackgroundColor,
	colordTextColor,
	colordLinkColor,
	backgroundColor,
	textColor,
	linkColor,
	shouldShowTransparencyWarning,
} ) {
	let msg = '';
	if ( shouldShowTransparencyWarning ) {
		msg = __( 'Transparent text may be hard for people to read.' );
	} else {
		const backgroundColorBrightness = colordBackgroundColor.brightness();
		msg =
			( colordTextColor &&
				backgroundColorBrightness < colordTextColor.brightness() ) ||
			( colordLinkColor &&
				backgroundColorBrightness < colordLinkColor.brightness() )
				? __(
						'This color combination may be hard for people to read. Try using a darker background color and/or a brighter text color.'
				  )
				: __(
						'This color combination may be hard for people to read. Try using a brighter background color and/or a darker text color.'
				  );
	}

	// Note: The `Notice` component can speak messages via its `spokenMessage`
	// prop, but the contrast checker requires granular control over when the
	// announcements are made. Notably, the message will be re-announced if a
	// new color combination is selected and the contrast is still insufficient.
	useEffect( () => {
		const speakMsg = shouldShowTransparencyWarning
			? __( 'Transparent text may be hard for people to read.' )
			: __( 'This color combination may be hard for people to read.' );
		speak( speakMsg );
	}, [ backgroundColor, textColor, linkColor ] );

	return (
		<div className="block-editor-contrast-checker">
			<Notice
				spokenMessage={ null }
				status="warning"
				isDismissible={ false }
			>
				{ msg }
			</Notice>
		</div>
	);
}

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
		if ( backgroundColorHasTransparency ) {
			shouldShowTransparencyWarning = true;
		}

		// If there is only one text color (text or link) and the color is readable with no transparency.
		if ( singleTextColor && isTextColorReadable ) {
			if ( ! textColorHasTransparency ) {
				return null;
			}
			shouldShowTransparencyWarning = true;
		}

		// If both text colors are readable, but transparent show the warning.
		if ( isTextColorReadable && isLinkColorReadable ) {
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
