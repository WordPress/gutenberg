/**
 * Internal dependencies
 */
import type { Field } from './types';

/**
 * Apply default values and normalize the fields config.
 *
 * @param fields Fields config.
 * @return Normalized fields config.
 */
export function normalizeFields( fields: Field[] ): Field[] {
	return fields.map( ( field ) => {
		const getValue = field.getValue || ( ( { item } ) => item[ field.id ] );

		return {
			...field,
			getValue,
			render: field.render || getValue,
		};
	} );
}
