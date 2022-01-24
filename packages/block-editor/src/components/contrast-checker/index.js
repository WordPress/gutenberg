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

/**
 * Internal dependencies
 */
import { useGetContrastCheckerColors } from './use-get-contrast-checker-colors';

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
	const currentTextColor = textColor || fallbackTextColor;
	const currentLinkColor = linkColor || fallbackLinkColor;
	const {
		shouldShowTransparencyWarning,
		shouldRenderMessage,
		colordBackgroundColor,
		colordTextColor,
		colordLinkColor,
	} = useGetContrastCheckerColors( {
		backgroundColor: currentBackgroundColor,
		textColor: currentTextColor,
		linkColor: currentLinkColor,
		isLargeText,
		fontSize,
		enableAlphaChecker,
	} );

	if ( ! shouldRenderMessage ) {
		return null;
	}

	return (
		<ContrastCheckerMessage
			backgroundColor={ currentBackgroundColor }
			textColor={ currentTextColor }
			linkColor={ currentLinkColor }
			colordBackgroundColor={ colordBackgroundColor }
			colordTextColor={ colordTextColor }
			colordLinkColor={ colordLinkColor }
			shouldShowTransparencyWarning={ shouldShowTransparencyWarning }
		/>
	);
}

export default ContrastChecker;
