/**
 * Internal dependencies
 */
import { is } from './is';

/**
 * @template {unknown[]} TArgs
 * @param {(...args: TArgs) => unknown} validate
 * @param {(...args: TArgs) => unknown} extraValidate
 */
export function mergeValidationFunctions( validate, extraValidate ) {
	if ( ! is.function( validate ) ) return;
	if ( ! is.function( extraValidate ) ) return validate;

	return ( /** @type {TArgs} */ ...args ) => {
		return validate( ...args ) || extraValidate( ...args );
	};
}
