import warning from '@wordpress/warning';
import type { RootProps } from './types';

export function warnAvatarColor( color: RootProps[ 'color' ] ): void {
	if ( color === undefined ) {
		return;
	}

	// Skip comments and strings, and keep custom-property names as whole tokens.
	// This is a best-effort scan; it does not decode CSS escapes or resolve var().
	const tokens = color.match(
		/\/\*[\s\S]*?(?:\*\/|$)|"(?:\\[\s\S]|[^"\\])*"|'(?:\\[\s\S]|[^'\\])*'|(?:[-\w\u0080-\uFFFF]|\\(?:[\da-fA-F]{1,6}[ \t\r\n\f]?|[^\r\n\f]))+/g
	);
	if ( tokens?.some( ( token ) => token.toLowerCase() === 'currentcolor' ) ) {
		warning(
			'Avatar.Root: `color` contains `currentColor`, which can produce insufficient contrast in colored fallbacks. Use a color that does not depend on the foreground.'
		);
		return;
	}

	if ( typeof CSS === 'undefined' || ! CSS.supports ) {
		return;
	}

	if ( ! CSS.supports( 'color', color ) ) {
		warning(
			'Avatar.Root: The browser does not support the `color` value. Use a valid CSS color supported by this browser.'
		);
	} else if (
		// Browsers without relative colors retain the neutral fallback.
		CSS.supports( 'color', 'rgb(from red r g b / 1)' ) &&
		! CSS.supports( 'color', `rgb(from ${ color } r g b / 1)` )
	) {
		warning(
			'Avatar.Root: `color` cannot be used as a colored fallback fill. Use an explicit CSS color instead of a CSS-wide keyword such as `inherit`.'
		);
	}
}
