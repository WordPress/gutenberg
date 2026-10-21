/**
 * Checks whether a value is a `File`, whichever browsing context created it.
 *
 * Each window has its own `File` constructor, so `instanceof File` is false
 * for a file created in another window than the one running this code (the
 * editor canvas is an iframe, and a synthetic drop can hand it files built in
 * the top window). The `Object.prototype.toString` tag comes from
 * `File.prototype[ Symbol.toStringTag ]`, which every realm's `File` and its
 * subclasses share, so it is the realm-independent test.
 *
 * @param value The value to check.
 *
 * @return Whether the value is a `File`.
 */
export function isFile( value: unknown ): value is File {
	return Object.prototype.toString.call( value ) === '[object File]';
}
