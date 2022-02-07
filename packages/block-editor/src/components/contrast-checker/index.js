/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { speak } from '@wordpress/a11y';
import { Notice } from '@wordpress/components';

/**
 * External dependencies
 */
import { colord, extend } from 'colord';
import namesPlugin from 'colord/plugins/names';
import a11yPlugin from 'colord/plugins/a11y';

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

	const textColors = [
		{
			color: currentTextColor,
			description: __( 'text color' ),
		},
		{
			color: currentLinkColor,
			description: __( 'link color' ),
		},
	];
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
		// If there is no color, go no further.
		if ( ! item.color ) {
			continue;
		}
		const colordTextColor = colord( item.color );
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
			message =
				backgroundColorBrightness < colordTextColor.brightness()
					? sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color"
							__(
								'This color combination may be hard for people to read. Try using a darker background color and/or a brighter %s.'
							),
							item.description
					  )
					: sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color"
							__(
								'This color combination may be hard for people to read. Try using a brighter background color and/or a darker %s.'
							),
							item.description
					  );
			speakMessage = __(
				'This color combination may be hard for people to read.'
			);
			// Break from the loop when we have a contrast warning.
			// These messages take priority over the transparency warning.
			break;
		}

		// If the text color is readable, but transparent, show the transparent warning.
		if ( textHasTransparency && enableAlphaChecker ) {
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
		<div className="block-editor-contrast-checker">
			<Notice
				spokenMessage={ null }
				status="warning"
				isDismissible={ false }
			>
				{ message }
			</Notice>
		</div>
	);
}

export default ContrastChecker;
