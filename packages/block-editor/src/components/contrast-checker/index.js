/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
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
	fontSize, // font size value in pixels
	isLargeText,
	textColors,
	enableAlphaChecker = false,
} ) {
	const currentBackgroundColor = backgroundColor || fallbackBackgroundColor;

	// Must have a background color and some colours to iterate over.
	if ( ! currentBackgroundColor || ! textColors || ! textColors.length ) {
		return null;
	}

	const colordBackgroundColor = colord( currentBackgroundColor );
	const backgroundColorHasTransparency = colordBackgroundColor.alpha() < 1;
	const backgroundColorBrightness = colordBackgroundColor.brightness();
	const isReadableOptions = {
		level: 'AA',
		size:
			isLargeText || ( isLargeText !== false && fontSize >= 24 )
				? 'large'
				: 'small',
	};

	let message = '';
	let speakMessage = '';
	for ( const item of textColors ) {
		const currentTextColor = item.color || item.fallback;
		// If there is no color, go no further.
		if ( ! currentTextColor ) {
			continue;
		}
		const colordTextColor = colord( currentTextColor );
		const isColordTextReadable = colordTextColor.isReadable(
			colordBackgroundColor,
			isReadableOptions
		);
		const textHasTransparency = colordTextColor.alpha() < 1;

		// If the contrast is not readable.
		if ( ! isColordTextReadable ) {
			// Don't show the message if the background or text is transparent.
			if ( backgroundColorHasTransparency || textHasTransparency ) {
				continue;
			}
			const description = item.description || __( 'text color' );
			message =
				backgroundColorBrightness < colordTextColor.brightness()
					? sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color"
							__(
								'This color combination may be hard for people to read. Try using a darker background color and/or a brighter %s.'
							),
							description
					  )
					: sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color"
							__(
								'This color combination may be hard for people to read. Try using a brighter background color and/or a darker %s.'
							),
							description
					  );
			speakMessage = __(
				'This color combination may be hard for people to read.'
			);
			// Break from the loop when we have a contrast warning.
			// These messages take priority over the transparency warning.
			break;
		}

		// If the text color is readable, but transparent, show the transparent warning.
		if ( textHasTransparency && true === enableAlphaChecker ) {
			message = __( 'Transparent text may be hard for people to read.' );
			speakMessage = __(
				'Transparent text may be hard for people to read.'
			);
		}
	}

	if ( ! message ) {
		return null;
	}

	// Note: The `Notice` component can speak messages via its `spokenMessage`
	// prop, but the contrast checker requires granular control over when the
	// announcements are made. Notably, the message will be re-announced if a
	// new color combination is selected and the contrast is still insufficient.
	speak( speakMessage );

	return (
		<ContrastCheckerMessage
			message={ message }
			speakMessage={ speakMessage }
		/>
	);
}

export default ContrastChecker;
