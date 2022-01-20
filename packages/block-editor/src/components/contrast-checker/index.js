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

function ContrastCheckerMessage( {
	colordBackgroundColor,
	colordTextColor,
	backgroundColor,
	textColor,
	shouldShowTransparencyWarning,
} ) {
	let msg = '';
	if ( shouldShowTransparencyWarning ) {
		msg = __( 'Transparent text may be hard for people to read.' );
	} else {
		msg =
			colordBackgroundColor.brightness() < colordTextColor.brightness()
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
	}, [ backgroundColor, textColor ] );

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
	fontSize, // font size value in pixels
	isLargeText,
	textColor,
	__experimentalEnableAlphaChecker = false,
} ) {
	if (
		! ( backgroundColor || fallbackBackgroundColor ) ||
		! ( textColor || fallbackTextColor )
	) {
		return null;
	}
	const colordBackgroundColor = colord(
		backgroundColor || fallbackBackgroundColor
	);
	const colordTextColor = colord( textColor || fallbackTextColor );
	const textColorHasTransparency = colordTextColor.alpha() < 1;
	const backgroundColorHasTransparency = colordBackgroundColor.alpha() < 1;
	const hasTransparency =
		textColorHasTransparency || backgroundColorHasTransparency;
	const isReadable = colordTextColor.isReadable( colordBackgroundColor, {
		level: 'AA',
		size:
			isLargeText || ( isLargeText !== false && fontSize >= 24 )
				? 'large'
				: 'small',
	} );

	// Don't show the message if the text is readable AND there's no transparency.
	// This is the default.
	if ( isReadable && ! hasTransparency ) {
		return null;
	}

	if ( hasTransparency ) {
		if (
			// If there's transparency, don't show the message if the alpha checker is disabled.
			! __experimentalEnableAlphaChecker ||
			// If the alpha checker is enabled, we only show the warning if the text has transparency.
			( isReadable && ! textColorHasTransparency )
		) {
			return null;
		}
	}

	return (
		<ContrastCheckerMessage
			backgroundColor={ backgroundColor }
			textColor={ textColor }
			colordBackgroundColor={ colordBackgroundColor }
			colordTextColor={ colordTextColor }
			// Flag to warn about transparency only if the text is otherwise readable according to colord
			// to ensure the readability warnings take precedence.
			shouldShowTransparencyWarning={
				isReadable && textColorHasTransparency
			}
		/>
	);
}

export default ContrastChecker;
