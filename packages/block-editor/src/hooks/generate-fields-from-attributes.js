/**
 * Generates DataForm field definitions from block attributes.
 *
 * This utility enables PHP-only blocks to have auto-generated inspector controls
 * by converting block attribute definitions into DataForm field definitions.
 *
 * @param {Object} attributes - Block type attributes from block registration
 * @return {{ fields: Array, form: Object }} fieldsKey and formKey values
 */
export function generateFieldsFromAttributes( attributes ) {
	const fields = [];
	const fieldIds = [];

	Object.entries( attributes ).forEach( ( [ name, def ] ) => {
		if ( ! def.autoGenerateControl ) {
			return;
		}

		const field = createFieldFromAttribute( name, def );
		if ( field ) {
			fields.push( field );
			fieldIds.push( name );
		}
	} );

	return {
		fields,
		form: { fields: fieldIds },
	};
}

/**
 * Creates a DataForm field definition from a block attribute definition.
 *
 * @param {string} name - The attribute name
 * @param {Object} def  - The attribute definition from block.json
 * @return {Object|null} DataForm field definition or null if type not supported
 */
function createFieldFromAttribute( name, def ) {
	const type = def.type;

	// Skip unsupported types (object, union types, etc.)
	// Supported: string→text, number, integer, boolean (1:1 with DataForm)
	if ( ! [ 'string', 'number', 'integer', 'boolean' ].includes( type ) ) {
		return null;
	}

	const field = {
		id: name,
		label: def.label || name,
		// Only 'string' needs mapping to 'text'; others are 1:1 with DataForm types.
		// This mapping will be unnecessary once #74105 lands.
		type: type === 'string' ? 'text' : type,
	};

	// Add elements for enums (DataForm shows select UI when elements are present)
	if ( def.enum && Array.isArray( def.enum ) ) {
		field.elements = def.enum.map( ( value ) => ( {
			value,
			label: String( value ),
		} ) );
	}

	return field;
}
