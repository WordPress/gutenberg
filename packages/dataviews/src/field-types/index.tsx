/**
 * Internal dependencies
 */
import { default as integer } from './integer';
import type { FieldType } from '../types';

/**
 *
 * @param {FieldType} type The field type definition to get.
 *
 * @return A field type definition.
 */
export default function getFieldTypeDefinition( type?: FieldType ) {
	if ( 'integer' === type ) {
		return integer;
	}

	// If no type found, the sort function doesn't do anything.
	return {
		sort: () => 0,
	};
}
