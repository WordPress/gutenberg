/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * Merges validation functions together.
 *
 * @template {unknown[]} TArgs
 * @param {(...args: TArgs) => unknown} validate
 * @param {(...args: TArgs) => unknown} extraValidate
 *
 * @return {Function | undefined} A single merged validation function.
 */
export function mergeValidationFunctions( validate, extraValidate ) {
	if ( ! is.function( validate ) ) return;
	if ( ! is.function( extraValidate ) ) return validate;

	/* eslint-disable jsdoc/no-undefined-types */
	return ( /** @type {TArgs} */ ...args ) =>
		/* eslint-enable jsdoc/no-undefined-types */
		{
			return validate( ...args ) || extraValidate( ...args );
		};
}
