const DANGEROUS_HTML = Symbol( 'DANGEROUS_HTML' );

/**
 * An immutable, opaque value produced by `asDangerousHTML()` that the
 * `data-wp-html` directive recognizes as trusted HTML.
 */
export interface DangerousHTML {
	readonly [ DANGEROUS_HTML ]: true;
	readonly html: string;
}

/**
 * Marks a string of HTML as trusted so the `data-wp-html` directive renders
 * it as markup instead of leaving the bound element's content untouched.
 *
 * The Interactivity API never sanitizes or otherwise processes the HTML
 * passed here. You are responsible for ensuring it comes from a trusted
 * source, the same way you would be when using `dangerouslySetInnerHTML` in
 * React. Never pass raw, unescaped user input to this function.
 *
 * Adding the returned value to `data-wp-context`, or serializing it as JSON,
 * does not carry the "trusted" marker with it — only a `data-wp-html`
 * reference that resolves directly to a value returned from this function is
 * rendered as HTML.
 *
 * @param html Raw HTML string to render.
 *
 * @return An opaque value the `data-wp-html` directive recognizes as trusted HTML.
 *
 * @example
 * ```js
 * import { asDangerousHTML, store } from '@wordpress/interactivity';
 *
 * store( 'myPlugin', {
 * 	state: {
 * 		get description() {
 * 			return asDangerousHTML(
 * 				'<p>A <strong>formatted</strong> description.</p>'
 * 			);
 * 		},
 * 	},
 * } );
 * ```
 */
export function asDangerousHTML( html: string ): DangerousHTML {
	return Object.freeze( { [ DANGEROUS_HTML ]: true as const, html } );
}

/**
 * Checks whether a value was produced by `asDangerousHTML()`.
 *
 * @param value Value to check.
 *
 * @return Whether the value is trusted HTML.
 */
export function isDangerousHTML( value: unknown ): value is DangerousHTML {
	return (
		typeof value === 'object' && value !== null && DANGEROUS_HTML in value
	);
}
