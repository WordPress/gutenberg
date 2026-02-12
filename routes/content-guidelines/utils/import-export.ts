/**
 * Internal dependencies
 */
import type { GuidelineCategories, BlockGuidelines } from '../types';

/**
 * Shape of a single block entry in the flat import/export format.
 */
interface ExportBlock {
	blockType: string;
	guidelines: string;
}

/**
 * The flat JSON structure used for importing and exporting guidelines.
 */
export interface ExportSchema {
	version: string;
	site: { guidelines: string };
	copy: { guidelines: string };
	images: { guidelines: string };
	blocks: ExportBlock[];
	additional: { guidelines: string };
}

/**
 * Validates that the provided data conforms to the expected import schema.
 *
 * @example
 * ```json
 * {
 *   "version": "1.0",
 *   "site": { "guidelines": "..." },
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
export function validateImportJson( data: unknown ): {
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
		if (
			typeof ( value as Record< string, unknown > ).guidelines !==
			'string'
		) {
			return {
				valid: false,
				error: `"${ key }.guidelines" must be a string.`,
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

/**
 * Maps the flat import JSON structure to the internal model.
 *
 * @param flatJson Validated import data.
 * @return Guideline categories in the internal format.
 */
export function mapImportToInternal(
	flatJson: ExportSchema
): GuidelineCategories {
	const blocks: BlockGuidelines = {};
	if ( flatJson.blocks ) {
		for ( const block of flatJson.blocks ) {
			blocks[ block.blockType ] = {
				guidelines: block.guidelines,
			};
		}
	}

	return {
		site: { guidelines: flatJson.site.guidelines },
		copy: { guidelines: flatJson.copy.guidelines },
		images: { guidelines: flatJson.images.guidelines },
		blocks,
		other: { guidelines: flatJson.additional.guidelines },
	};
}

/**
 * Maps the internal model to the flat export JSON structure.
 *
 * @param categories The guideline categories.
 * @return The flat export schema ready for serialisation.
 */
export function mapInternalToExport(
	categories: GuidelineCategories
): ExportSchema {
	const blocks: ExportBlock[] = Object.entries( categories.blocks ).map(
		( [ blockType, value ] ) => ( {
			blockType,
			guidelines: value.guidelines,
		} )
	);

	return {
		version: '1.0',
		site: { guidelines: categories.site.guidelines },
		copy: { guidelines: categories.copy.guidelines },
		images: { guidelines: categories.images.guidelines },
		blocks,
		additional: { guidelines: categories.other.guidelines },
	};
}
