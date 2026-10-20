import warning from '@wordpress/warning';
import type { AvatarProps } from './types';

function getColorWarning( color: string ): string | undefined {
	// Skip comments and strings, and keep custom-property names as whole tokens.
	// This is a best-effort scan; it does not decode CSS escapes or resolve var().
	const tokens = color.match(
		/\/\*[\s\S]*?(?:\*\/|$)|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|(?:[-\w\u0080-\uFFFF]|\\(?:[\da-fA-F]{1,6}[ \t\r\n\f]?|[^\r\n\f]))+/g
	);
	if ( tokens?.some( ( token ) => token.toLowerCase() === 'currentcolor' ) ) {
		return 'Avatar: `color` contains `currentColor`, which can produce insufficient contrast in colored fallbacks. Use a color that does not depend on the foreground.';
	}

	if (
		/^(inherit|initial|unset|revert|revert-layer)$/i.test( color.trim() )
	) {
		return 'Avatar: `color` cannot be used as a colored fallback fill. Use an explicit CSS color instead of a CSS-wide keyword such as `inherit`.';
	}

	if ( typeof CSS === 'undefined' || ! CSS.supports ) {
		return;
	}

	if ( ! CSS.supports( 'color', color ) ) {
		return 'Avatar: The browser does not support the `color` value. Use a valid CSS color supported by this browser.';
	} else if (
		// Browsers without relative colors retain the neutral fallback.
		CSS.supports( 'color', 'rgb(from red r g b / 1)' ) &&
		! CSS.supports( 'color', `rgb(from ${ color } r g b / 1)` )
	) {
		return 'Avatar: `color` cannot be used as a colored fallback fill. Use an explicit CSS color instead of a CSS-wide keyword such as `inherit`.';
	}
	return undefined;
}

/**
 * Validate direct colors; CSS handles variables that resolve to invalid values.
 *
 * @param color The requested avatar color.
 */
export function getAvatarColor(
	color: AvatarProps[ 'color' ]
): AvatarProps[ 'color' ] {
	if ( color === undefined ) {
		return;
	}
	const message = getColorWarning( color );
	if ( message ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			warning( message );
		}
		return;
	}
	return color;
}
