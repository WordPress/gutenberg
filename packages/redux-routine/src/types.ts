/**
 * Add type guard for isPlainObject until the below PR gets merged:
 *
 * @see https://github.com/jonschlinkert/is-plain-object/pull/29
 */

declare module 'is-plain-object' {
	export function isPlainObject(
		value: unknown
	): value is Record< PropertyKey, unknown >;
}
