/**
 * Internal dependencies
 */
import type { FieldType, ValidationContext } from '../types';
import { default as integer } from './integer';
import { default as text } from './text';

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

	if ( 'text' === type ) {
		return text;
	}

	return {
		sort: () => 0,
		isValid: ( value: any, context?: ValidationContext ) => {
			if ( context?.elements ) {
				const validValues = context?.elements?.map( ( f ) => f.value );
				if ( ! validValues.includes( value ) ) {
					return false;
				}
			}

			return true;
		},
	};
}
