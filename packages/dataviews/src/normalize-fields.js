/**
 * Apply default values and normalize the fields config.
 *
 * @param {Object[]} fields Raw Fields.
 * @return {Object[]} Normalized fields.
 */
export function normalizeFields( fields ) {
	return fields.map( ( field ) => {
		const getValue = field.getValue || ( ( { item } ) => item[ field.id ] );

		return {
			...field,
			getValue,
			render: field.render || getValue,
		};
	} );
}
