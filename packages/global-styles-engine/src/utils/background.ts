/**
 * Internal dependencies
 */
import type { BackgroundStyle } from '../types';

export const BACKGROUND_BLOCK_DEFAULT_VALUES = {
	backgroundSize: 'cover',
	backgroundPosition: '50% 50%', // used only when backgroundSize is 'contain'.
};

/**
 * Whether a background image resolves to a URL, as opposed to a reference or an
 * unresolved value.
 *
 * @param backgroundImage The background image value.
 *
 * @return Whether the value carries a URL.
 */
function hasImageUrl(
	backgroundImage: BackgroundStyle[ 'backgroundImage' ]
): backgroundImage is { url: string } {
	return (
		typeof backgroundImage === 'object' &&
		backgroundImage !== null &&
		'url' in backgroundImage &&
		!! backgroundImage.url
	);
}

export function setBackgroundStyleDefaults( backgroundStyle: BackgroundStyle ) {
	if (
		! backgroundStyle ||
		! hasImageUrl( backgroundStyle.backgroundImage )
	) {
		return;
	}

	let backgroundStylesWithDefaults;

	// Set block background defaults.
	if ( ! backgroundStyle?.backgroundSize ) {
		backgroundStylesWithDefaults = {
			backgroundSize: BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundSize,
		};
	}

	if (
		'contain' === backgroundStyle?.backgroundSize &&
		! backgroundStyle?.backgroundPosition
	) {
		backgroundStylesWithDefaults = {
			backgroundPosition:
				BACKGROUND_BLOCK_DEFAULT_VALUES.backgroundPosition,
		};
	}
	return backgroundStylesWithDefaults;
}
