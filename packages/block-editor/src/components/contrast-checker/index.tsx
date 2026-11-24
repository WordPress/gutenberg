import a11yPlugin from 'colord/plugins/a11y';
import namesPlugin from 'colord/plugins/names';
import { colord, extend } from 'colord';
import type { Colord } from 'colord';
import { __, sprintf } from '@wordpress/i18n';
import { Notice as WCNotice } from '@wordpress/components';
import { speak } from '@wordpress/a11y';
import type { ContrastCheckerProps, ContrastWarning } from './types';

extend( [ namesPlugin, a11yPlugin ] );

/**
 * Returns the color a reader sees when a color is painted over an opaque
 * backdrop. A transparent color blends with the backdrop in proportion to its
 * alpha, so its contrast has to be measured on the blended color: `colord`
 * ignores alpha when it computes contrast.
 *
 * @param color    Color painted over the backdrop.
 * @param backdrop Opaque color behind it.
 * @return The opaque color the reader sees.
 */
function getVisibleColor( color: Colord, backdrop: Colord ): Colord {
	const alpha = color.alpha();
	if ( alpha >= 1 ) {
		return color;
	}

	const foreground = color.toRgb();
	const background = backdrop.toRgb();
	const blend = ( channel: 'r' | 'g' | 'b' ) =>
		Math.round(
			foreground[ channel ] * alpha +
				background[ channel ] * ( 1 - alpha )
		);

	return colord( { r: blend( 'r' ), g: blend( 'g' ), b: blend( 'b' ) } );
}

/**
 * Computes a contrast warning for the given color combination, if any.
 *
 * Shared between the `ContrastChecker` component and the block inspector
 * contrast warning indicators, which surface the result without rendering
 * a notice.
 *
 * @param props
 * @param props.backgroundColor         Background color.
 * @param props.fallbackBackgroundColor Fallback background color.
 * @param props.fallbackTextColor       Fallback text color.
 * @param props.fallbackLinkColor       Fallback link color.
 * @param props.fontSize                Font size value in pixels.
 * @param props.isLargeText             Whether the text is large.
 * @param props.textColor               Text color.
 * @param props.linkColor               Link color.
 * @param props.messageOverride         Caller-provided copy used in place of the generic guidance.
 * @param props.enableAlphaChecker      Whether to warn about transparent text.
 *
 * @return `{ message, speakMessage }` when contrast is insufficient, otherwise `null`.
 */
export function getContrastWarning( {
	backgroundColor,
	fallbackBackgroundColor,
	fallbackTextColor,
	fallbackLinkColor,
	fontSize, // Font size value in pixels.
	isLargeText,
	textColor,
	linkColor,
	messageOverride,
	enableAlphaChecker = false,
}: ContrastCheckerProps ): ContrastWarning | null {
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
			// An unset font size compares as `false`.
			isLargeText ||
			( isLargeText !== false && ( fontSize as number ) >= 24 )
				? 'large'
				: 'small',
	};

	let contrastMessage = '';
	let contrastSpeakMessage = '';
	let hasTransparentText = false;
	for ( const item of textColors ) {
		// If there is no color, go no further.
		if ( ! item.color ) {
			continue;
		}
		const colordTextColor = colord( item.color );
		if ( colordTextColor.alpha() < 1 ) {
			hasTransparentText = true;
		}

		// Only the first contrast warning is kept, but every color is still
		// visited so that a transparent one is noted. Contrast can only be
		// measured against an opaque background, as what shows through a
		// transparent one is unknown.
		if ( contrastMessage || backgroundColorHasTransparency ) {
			continue;
		}
		const visibleTextColor = getVisibleColor(
			colordTextColor,
			colordBackgroundColor
		);
		const isColordTextReadable = visibleTextColor.isReadable(
			colordBackgroundColor,
			// `colord` reads any size but `large` as normal.
			isReadableOptions as Parameters<
				typeof visibleTextColor.isReadable
			>[ 1 ]
		);

		// If the contrast is not readable.
		if ( ! isColordTextReadable ) {
			// A caller can provide panel-specific copy that is clearer and
			// more concise than the generic brighter/darker guidance.
			if ( messageOverride ) {
				contrastMessage = messageOverride;
				contrastSpeakMessage = messageOverride;
				continue;
			}
			contrastMessage =
				backgroundColorBrightness < visibleTextColor.brightness()
					? sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color".
							__(
								'This color combination may be hard for people to read. Try using a darker background color and/or a brighter %s.'
							),
							item.description
						)
					: sprintf(
							// translators: %s is a type of text color, e.g., "text color" or "link color".
							__(
								'This color combination may be hard for people to read. Try using a brighter background color and/or a darker %s.'
							),
							item.description
						);
			contrastSpeakMessage = __(
				'This color combination may be hard for people to read.'
			);
		}
	}

	// Transparency makes text harder to read whatever its contrast, so the
	// transparency warning is added to any contrast warning, not replaced by
	// it.
	const transparencyMessage =
		enableAlphaChecker && hasTransparentText
			? __( 'Transparent text may be hard for people to read.' )
			: '';

	if ( ! contrastMessage && ! transparencyMessage ) {
		return null;
	}

	return {
		message: [ contrastMessage, transparencyMessage ]
			.filter( Boolean )
			.join( ' ' ),
		speakMessage: [ contrastSpeakMessage, transparencyMessage ]
			.filter( Boolean )
			.join( ' ' ),
	};
}

function ContrastChecker( props: ContrastCheckerProps ) {
	const warning = getContrastWarning( props );

	if ( ! warning ) {
		return null;
	}

	// Note: The `Notice` component can speak messages via its `spokenMessage`
	// prop, but the contrast checker requires granular control over when the
	// announcements are made. Notably, the message will be re-announced if a
	// new color combination is selected and the contrast is still insufficient.
	speak( warning.speakMessage );

	return (
		<div className="block-editor-contrast-checker">
			<WCNotice
				spokenMessage={ null }
				status="warning"
				isDismissible={ false }
			>
				{ warning.message }
			</WCNotice>
		</div>
	);
}

/**
 * @see https://github.com/WordPress/gutenberg/blob/HEAD/packages/block-editor/src/components/contrast-checker/README.md
 */
export default ContrastChecker;
