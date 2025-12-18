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
		if ( ! def.__experimentalAutoField ) {
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
	// Handle union types (e.g., ["string", "null"]) by using the first type
	const type = Array.isArray( def.type ) ? def.type[ 0 ] : def.type;

	// Skip unsupported types (array, object, etc.)
	// Supported: string→text, number, integer, boolean (1:1 with DataForm)
	if ( ! [ 'string', 'number', 'integer', 'boolean' ].includes( type ) ) {
		return null;
	}

	const field = {
		id: name,
		label: humanizeKey( name ),
		// Only 'string' needs mapping to 'text'; others are 1:1 with DataForm types
		type: type === 'string' ? 'text' : type,
	};

	// Add elements for enums (DataForm shows select UI when elements are present)
	if ( def.enum && Array.isArray( def.enum ) ) {
		field.elements = def.enum.map( ( value ) => ( {
			value,
			label: humanizeKey( String( value ) ),
		} ) );
	}

	return field;
}

/**
 * Converts an attribute name to a human-readable label.
 *
 * @param {string} str - The attribute name (camelCase or snake_case)
 * @return {string} Human-readable label
 *
 * @example
 * humanizeKey('backgroundColor') // "Background Color"
 * humanizeKey('show_title')      // "Show Title"
 * humanizeKey('itemCount')       // "Item Count"
 */
function humanizeKey( str ) {
	return str
		.replace( /([A-Z])/g, ' $1' ) // Add space before capitals
		.replace( /[_-]/g, ' ' ) // Replace underscores/hyphens with spaces
		.trim()
		.replace( /^\w/, ( c ) => c.toUpperCase() ); // Capitalize first letter
}
