/**
 * External dependencies
 */
const { input, select, confirm } = require( '@inquirer/prompts' );

/**
 * Attribute types supported by WordPress blocks
 */
const ATTRIBUTE_TYPES = [
	{ name: 'String', value: 'string' },
	{ name: 'Number', value: 'number' },
	{ name: 'Boolean', value: 'boolean' },
	{ name: 'Array', value: 'array' },
	{ name: 'Object', value: 'object' },
];

/**
 * Configure block attributes with simple prompts
 *
 * @param {Object} existingAttributes Existing attributes to start with
 *
 * @return {Object} Configured attributes
 */
async function configureBlockAttributes( existingAttributes = {} ) {
	const attributes = { ...existingAttributes };

	let addMore = true;
	while ( addMore ) {
		const attributeConfig = await createAttribute();
		if ( attributeConfig ) {
			attributes[ attributeConfig.name ] = {
				type: attributeConfig.type,
				default: attributeConfig.default,
			};
		}

		addMore = await confirm( {
			message: 'Add another attribute?',
			default: false,
		} );
	}

	return attributes;
}

/**
 * Create a single attribute
 */
async function createAttribute() {
	const name = await input( {
		message: 'Attribute name:',
		validate: ( userInput ) => {
			if ( ! userInput.trim() ) {
				return 'Attribute name is required';
			}
			if ( ! /^[a-zA-Z][a-zA-Z0-9]*$/.test( userInput ) ) {
				return 'Use camelCase format (letters and numbers, starting with letter)';
			}
			return true;
		},
	} );

	const type = await select( {
		message: `Type for "${ name }":`,
		choices: ATTRIBUTE_TYPES,
		default: 'string',
	} );

	const defaultValue = await input( {
		message: `Default value for "${ name }" (optional):`,
		default: getDefaultForType( type ),
	} );

	return {
		name,
		type,
		default: parseValue( defaultValue, type ),
	};
}

/**
 * Get suggested default value for type
 *
 * @param {string} type Attribute type
 *
 * @return {string} Default value as string
 */
function getDefaultForType( type ) {
	switch ( type ) {
		case 'string':
			return '';
		case 'number':
			return '0';
		case 'boolean':
			return 'false';
		case 'array':
			return '[]';
		case 'object':
			return '{}';
		default:
			return '';
	}
}

/**
 * Parse value based on type
 *
 * @param {string} value Value as string
 * @param {string} type  Attribute type
 *
 * @return {unknown} Parsed value
 */
function parseValue( value, type ) {
	if ( ! value.trim() ) {
		return getDefaultForType( type ) === ''
			? ''
			: JSON.parse( getDefaultForType( type ) );
	}

	switch ( type ) {
		case 'boolean':
			return value.toLowerCase() === 'true' || value === '1';
		case 'number':
			const num = Number( value );
			return isNaN( num ) ? 0 : num;
		case 'array':
			try {
				return JSON.parse( value );
			} catch {
				return [];
			}
		case 'object':
			try {
				return JSON.parse( value );
			} catch {
				return {};
			}
		default:
			return value;
	}
}

module.exports = {
	configureBlockAttributes,
};
