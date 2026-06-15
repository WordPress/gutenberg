/**
 * Returns a string with greater-than sign replaced.
 *
 * Note that if a resolution for Trac#45387 comes to fruition, it is no longer
 * necessary for `__unstableEscapeGreaterThan` to exist.
 *
 * See: https://core.trac.wordpress.org/ticket/45387
 *
 * @param value Original string.
 *
 * @return Escaped string.
 */
export default function __unstableEscapeGreaterThan( value: string ): string {
	return value.replace( />/g, '&gt;' );
}
