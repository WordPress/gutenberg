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
	if ( ! ( backgroundColor || fallbackBackgroundColor ) ) {
		return null;
	}

	const hasTextColor = !! ( textColor || fallbackTextColor );
	const hasLinkColor = !! ( linkColor || fallbackLinkColor );

	// Must have at least one text color.
	if ( ! hasLinkColor && ! hasTextColor ) {
		return null;
	}

	const colordBackgroundColor = colord(
		backgroundColor || fallbackBackgroundColor
	);
	const colordTextColor = colord( textColor || fallbackTextColor );
	const colordLinkColor = colord( linkColor || fallbackLinkColor );
	const textColorHasTransparency =
		colordTextColor && colordTextColor.alpha() < 1;
	const linkColorHasTransparency =
		colordLinkColor && colordLinkColor.alpha() < 1;
	const backgroundColorHasTransparency = colordBackgroundColor.alpha() < 1;

	const hasTransparency =
		backgroundColorHasTransparency ||
		textColorHasTransparency ||
		linkColorHasTransparency;

	const textSize =
		isLargeText || ( isLargeText !== false && fontSize >= 24 )
			? 'large'
			: 'small';

	const isTextColorReadable =
		hasTextColor &&
		colordTextColor.isReadable( colordBackgroundColor, {
			level: 'AA',
			size: textSize,
		} );

	const isLinkColorReadable =
		hasLinkColor &&
		colordLinkColor.isReadable( colordBackgroundColor, {
			level: 'AA',
			size: textSize,
		} );

	// Don't show the message if the text is readable AND there's no transparency.
	// This is the default.
	if ( ! hasTransparency ) {
		if ( ! hasLinkColor && isTextColorReadable ) {
			return null;
		}

		if ( ! hasTextColor && isLinkColorReadable ) {
			return null;
		}

		if ( isTextColorReadable && isLinkColorReadable ) {
			return null;
		}
	}

	if ( hasTransparency ) {
		// If there's transparency, don't show the message if the alpha checker is disabled.
		if ( ! enableAlphaChecker ) {
			return null;
		}

		// If the background has transparency, don't show any warnings.
		if (
			backgroundColorHasTransparency &&
			( ! textColorHasTransparency || ! linkColorHasTransparency )
		) {
			return null;
		}

		// Only text color.
		if (
			! hasLinkColor &&
			isTextColorReadable &&
			! textColorHasTransparency
		) {
			return null;
		}

		if (
			! hasTextColor &&
			isLinkColorReadable &&
			! linkColorHasTransparency
		) {
			return null;
		}

		if (
			isTextColorReadable &&
			! textColorHasTransparency &&
			isLinkColorReadable &&
			! linkColorHasTransparency
		) {
			return null;
		}
	}

	// Flag to warn about transparency only if the text is otherwise readable according to colord
	// to ensure the readability warnings take precedence.
	let shouldShowTransparencyWarning = false;

	if ( ! hasLinkColor ) {
		if ( isTextColorReadable && textColorHasTransparency ) {
			shouldShowTransparencyWarning = true;
		}
	}

	if ( ! hasTextColor ) {
		if ( isLinkColorReadable && linkColorHasTransparency ) {
			shouldShowTransparencyWarning = true;
		}
	}

	if ( hasTextColor && hasLinkColor ) {
		if ( linkColorHasTransparency && textColorHasTransparency ) {
			shouldShowTransparencyWarning = true;
		}

		if (
			isLinkColorReadable &&
			linkColorHasTransparency &&
			! textColorHasTransparency &&
			isTextColorReadable
		) {
			shouldShowTransparencyWarning = true;
		}

		if (
			isTextColorReadable &&
			textColorHasTransparency &&
			! linkColorHasTransparency &&
			isLinkColorReadable
		) {
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
