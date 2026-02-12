/**
 * Validates that the provided data conforms to the expected guidelines schema.
 *
 * @example
 * ```json
 * {
 *   "site": { "label": "Site Context", "guidelines": "..." },
 *   "copy": { "guidelines": "..." },
 *   "images": { "guidelines": "..." },
 *   "blocks": [
 *     {
 *       "blockType": "paragraph",
 *       "guidelines": "..."
 *     }
 *   ],
 *   "additional": { "guidelines": "..." }
 * }
 * ```
 *
 * @param data Parsed JSON data to validate.
 * @return Object indicating validity and an optional error message.
 */
export function validateGuidelinesJson( data: unknown ): {
	valid: boolean;
	error?: string;
} {
	if ( ! data || typeof data !== 'object' ) {
		return { valid: false, error: 'Invalid JSON: expected an object.' };
	}

	const json = data as Record< string, unknown >;

	const requiredCategories = [ 'site', 'copy', 'images', 'additional' ];
	for ( const key of requiredCategories ) {
		const value = json[ key ];
		if ( ! value || typeof value !== 'object' ) {
			return {
				valid: false,
				error: `Missing or invalid "${ key }" field.`,
			};
		}

		const category = value as Record< string, unknown >;
		if ( typeof category.guidelines !== 'string' ) {
			return {
				valid: false,
				error: `"${ key }.guidelines" must be a string.`,
			};
		}
		if (
			category.label !== undefined &&
			typeof category.label !== 'string'
		) {
			return {
				valid: false,
				error: `"${ key }.label" must be a string.`,
			};
		}
	}

	if ( json.blocks !== undefined ) {
		if ( ! Array.isArray( json.blocks ) ) {
			return {
				valid: false,
				error: '"blocks" must be an array.',
			};
		}
		for ( const block of json.blocks ) {
			if ( ! block || typeof block !== 'object' ) {
				return {
					valid: false,
					error: 'Each block entry must be an object.',
				};
			}
			if ( typeof block.blockType !== 'string' ) {
				return {
					valid: false,
					error: 'Each block entry must have a "blockType" string.',
				};
			}
			if ( typeof block.guidelines !== 'string' ) {
				return {
					valid: false,
					error: 'Each block entry must have a "guidelines" string.',
				};
			}
		}
	}

	return { valid: true };
}
