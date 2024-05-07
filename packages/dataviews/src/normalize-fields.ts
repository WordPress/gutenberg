/**
 * Internal dependencies
 */
import type { Field, NormalizedField } from './types';

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export function normalizeFields( fields: Field[] ): NormalizedField[] {
	return fields.map( ( field ) => {
		const getValue = field.getValue || ( ( { item } ) => item[ field.id ] );

		return {
			...field,
			header: field.header || field.id,
			getValue,
			render: field.render || getValue,
		};
	} );
}
