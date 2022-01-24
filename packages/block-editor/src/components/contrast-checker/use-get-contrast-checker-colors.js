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
import { useEffect, useMemo } from '@wordpress/element';

extend( [ namesPlugin, a11yPlugin ] );

export function useGetContrastCheckerColors( {
	backgroundColor,
	textColor,
	linkColor,
	enableAlphaChecker = false,
	alphaThreshold = 1,
	isLargeText,
	fontSize,
} ) {
	return useMemo( () => {
		// Flag to indicate that we should show the message.
		let shouldRenderMessage = false;

		// Flag to warn about transparency only if the text is otherwise readable according to colord
		// to ensure the readability warnings take precedence.
		let shouldShowTransparencyWarning = false;

		// Must have a background color.
		if ( ! backgroundColor ) {
			return {
				shouldRenderMessage,
				shouldShowTransparencyWarning,
			};
		}
		// Must have at least one text color.
		if ( !! textColor && !! linkColor ) {
			return {
				shouldRenderMessage,
				shouldShowTransparencyWarning,
			};
		}

		const colordBackgroundColor = colord( backgroundColor );
		const backgroundColorHasTransparency =
			colordBackgroundColor.alpha() < 1;

		const hasTextAndLinkColors = textColor && linkColor;
		// If there's only one color passed, store in `singleTextColor`.
		const singleTextColor = hasTextAndLinkColors
			? null
			: textColor || linkColor;

		const colordTextColor = singleTextColor
			? colord( singleTextColor )
			: colord( textColor );
		const colordLinkColor = colord( linkColor );

		// Transparency.
		const textColorHasTransparency =
			textColor && colordTextColor.alpha() < alphaThreshold;
		const linkColorHasTransparency =
			linkColor && colordLinkColor.alpha() < alphaThreshold;

		// Text size
		const size =
			isLargeText || ( isLargeText !== false && fontSize >= 24 )
				? 'large'
				: 'small';

		// Readability.
		const isTextColorReadable =
			textColor &&
			colordTextColor.isReadable( colordBackgroundColor, {
				level: 'AA',
				size,
			} );

		const isLinkColorReadable =
			linkColor &&
			colordLinkColor.isReadable( colordBackgroundColor, {
				level: 'AA',
				size,
			} );

		// Don't show the message if the text is readable AND there's no transparency.
		// This is the default.
		if ( ! textColorHasTransparency && ! linkColorHasTransparency ) {
			// If the background has transparency, don't show any contrast warnings.
			if (
				backgroundColorHasTransparency ||
				( isTextColorReadable && isLinkColorReadable ) ||
				( singleTextColor && isTextColorReadable )
			) {
				return {
					shouldRenderMessage,
					shouldShowTransparencyWarning,
				};
			}
		} else {
			// If there's text transparency, don't show the message if the alpha checker is disabled.
			if ( ! enableAlphaChecker ) {
				return {
					shouldRenderMessage,
					shouldShowTransparencyWarning,
				};
			}

			// If the background has transparency, don't show any contrast warnings.
			if ( backgroundColorHasTransparency ) {
				return {
					shouldRenderMessage: true,
					shouldShowTransparencyWarning: true,
				};
			}

			// If there is only one text color (text or link) and the color is readable with no transparency.
			if ( singleTextColor && isTextColorReadable ) {
				if ( ! textColorHasTransparency ) {
					return {
						shouldRenderMessage: false,
						shouldShowTransparencyWarning: false,
					};
				}
				return {
					shouldRenderMessage: true,
					shouldShowTransparencyWarning: true,
				};
			}

			// If both text colors are readable, but transparent show the warning.
			if ( isTextColorReadable && isLinkColorReadable ) {
				return {
					shouldRenderMessage: true,
					shouldShowTransparencyWarning: true,
				};
			}
		}

		return {
			shouldRenderMessage,
			shouldShowTransparencyWarning,
			colordBackgroundColor,
			colordTextColor,
			colordLinkColor,
		};
	}, [ backgroundColor, textColor, linkColor ] );
}
