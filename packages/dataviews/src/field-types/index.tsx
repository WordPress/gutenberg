/**
 * Internal dependencies
 */
import { default as integer } from './integer';
import type { FieldType, Option } from '../types';

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

	return {
		sort: () => 0,
		isValid: ( value: any, elements?: Option[] ) => {
			if ( elements ) {
				const validValues = elements.map( ( f ) => f.value );
				if ( ! validValues.includes( value ) ) {
					return false;
				}
			}

			return true;
		},
	};
}
