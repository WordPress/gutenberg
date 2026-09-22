/**
 * Minimal ambient type for the DOM Trusted Types `TrustedHTML` interface.
 * Not yet part of this project's configured TypeScript DOM lib; declared
 * here to match the specification's actual (opaque, `toJSON()`-only) shape.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/TrustedHTML
 */
interface TrustedHTML {
	toJSON: () => string;
}

/**
 * An immutable, opaque token produced by `asDangerousHTML()` that the
 * `data-wp-html` directive recognizes as trusted HTML.
 *
 * The token carries no inspectable trace of the HTML it represents: the
 * actual value lives in a private `WeakMap` keyed by the token object, not
 * on the token itself. Cloning the token (structured clone, spreading it
 * into a new object, `JSON.stringify()`/`parse()`, …) produces a plain
 * object with none of its own properties, which is not present in that
 * `WeakMap` and is therefore never treated as trusted.
 */
export type DangerousHTML = Readonly< Record< never, never > >;

// Private: maps each token returned by `asDangerousHTML()` to the HTML value
// it represents. Never exported — the token itself is the only way to look
// a value up here.
const trustedHtmlByToken = new WeakMap< DangerousHTML, string | TrustedHTML >();

/**
 * Marks a string (or native `TrustedHTML`) as trusted so the `data-wp-html`
 * directive renders it as markup instead of leaving the bound element's
 * content untouched.
 *
 * This function never sanitizes or otherwise processes the HTML passed
 * here, the same responsibility you take on using `dangerouslySetInnerHTML`
 * in React. Treating untrusted input as trusted is an XSS risk: never pass
 * it raw, unescaped user input, and never pass it a `context` value
 * directly. `context` is for selecting *which* trusted markup to show; the
 * markup itself should come from `state`, computed by your own code from a
 * source it trusts.
 *
 * The returned token is opaque and identity-based, not content-based: it
 * carries no inspectable trace of the HTML it wraps. Adding it to
 * `data-wp-context`, spreading it into a new object, or serializing it as
 * JSON does not carry the "trusted" marker with it — only a `data-wp-html`
 * reference that resolves directly to the exact value this function
 * returned is ever rendered as HTML.
 *
 * This package creates no Trusted Types policy of its own. On a site that
 * enforces Trusted Types with no default policy, a plain `string` argument
 * causes the browser to reject the eventual `element.innerHTML` write, and
 * the element's existing content is left in place. Pass a `TrustedHTML`
 * value from the site's own policy instead —
 * `asDangerousHTML( myPolicy.createHTML( markup ) )` — and it's passed
 * through to the DOM unchanged.
 *
 * "Trusted" here only means the `data-wp-html` directive will render it and
 * the Interactivity API won't process directives inside it. It's still live
 * browser HTML once rendered — that a `<script>` tag inside won't execute
 * is an artifact of how `innerHTML` works, not a security boundary. Content
 * that isn't safe to render as HTML isn't made safe by this function.
 *
 * @param html Raw HTML string, or a native `TrustedHTML` value from a
 *             site-provided Trusted Types policy, to render.
 *
 * @return An opaque token the `data-wp-html` directive recognizes as trusted HTML.
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
export function asDangerousHTML( html: string | TrustedHTML ): DangerousHTML {
	const token: DangerousHTML = Object.freeze( Object.create( null ) );
	trustedHtmlByToken.set( token, html );
	return token;
}

/**
 * Checks whether a value was produced by `asDangerousHTML()`.
 *
 * @param value Value to check.
 *
 * @return Whether the value is a trusted HTML token.
 */
export function isDangerousHTML( value: unknown ): value is DangerousHTML {
	return (
		typeof value === 'object' &&
		value !== null &&
		trustedHtmlByToken.has( value as DangerousHTML )
	);
}

/**
 * Retrieves the HTML value a trusted HTML token represents.
 *
 * @param token A token previously returned by `asDangerousHTML()`.
 *
 * @return The HTML value the token represents.
 */
export function getDangerousHTML( token: DangerousHTML ): string | TrustedHTML {
	return trustedHtmlByToken.get( token )!;
}
