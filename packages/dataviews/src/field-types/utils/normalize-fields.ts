/**
 * External dependencies
 */

/**
 * Internal dependencies
 */
import getFieldTypeDefinition from '..';
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
		const normalize = getFieldTypeDefinition< Item >( field.type );

		return normalize( field );
	} );
}
