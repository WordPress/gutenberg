/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import getNormalizeFieldFunction from '..';
import type { Field, NormalizedField } from '../../types';

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export default function normalizeFields< Item >(
	fields: Field< Item >[]
): NormalizedField< Item >[] {
	return fields.map( ( field ) => {
		const normalize = getNormalizeFieldFunction< Item >( field.type );

		return normalize( field );
	} );
}
