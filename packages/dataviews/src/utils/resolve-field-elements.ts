/**
 * Internal dependencies
 */
import type { FieldElementsSource, Option } from '../types';

/**
 * Resolves any supported field elements source to a concrete array of options.
 *
 * @param source Field elements source definition.
 *
 * @return Promise resolving to an array of options.
 */
export default async function resolveFieldElements(
	source: FieldElementsSource | undefined
): Promise< Option[] > {
	if ( ! source ) {
		return [];
	}

	if ( Array.isArray( source ) ) {
		return source;
	}

	const result = await ( typeof source === 'function' ? source() : source );

	if ( Array.isArray( result ) ) {
		return result;
	}

	return [];
}
