// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { version } from 'react';

const majorVersion = parseInt( version, 10 );

/**
 * Returns a value for the `inert` prop that the running version of React
 * renders as the `inert` HTML attribute.
 *
 * React 19 handles `inert` as a boolean attribute, while React 18 knows nothing
 * about `inert` and ignores `inert={ true }`, so it has to be given the string
 * `'true'` instead.
 *
 * The return type describes what React 19 types accept. React 18 doesn't support
 * `inert` HTML attribute at all, so a TypeScript call site still
 * needs a `@ts-expect-error` annotation.
 *
 * Inspired by the helper of the same name in the Base UI library.
 *
 * @param value Boolean value for the `inert` prop.
 * @return The actual value to pass to the `inert` prop.
 */
export function inertValue( value?: boolean ): boolean | undefined {
	if ( majorVersion >= 19 ) {
		return value;
	}

	return ( value ? 'true' : undefined ) as unknown as boolean | undefined;
}
