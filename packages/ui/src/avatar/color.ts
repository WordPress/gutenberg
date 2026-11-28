import warning from '@wordpress/warning';
import type { AvatarProps } from './types';

function getDisallowedColorWarning( color: string ): string | undefined {
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
	const message = getDisallowedColorWarning( color );
	if ( message ) {
		if ( process.env.NODE_ENV !== 'production' ) {
			warning( message );
		}
		return;
	}
	// Keep server and client markup identical. CSS supplies the neutral colors
	// when the browser cannot resolve the value.
	if (
		process.env.NODE_ENV !== 'production' &&
		typeof CSS !== 'undefined' &&
		CSS.supports &&
		! CSS.supports( 'color', color )
	) {
		warning(
			'Avatar: The browser does not support the `color` value. Use a valid CSS color supported by this browser.'
		);
	}
	return color;
}
