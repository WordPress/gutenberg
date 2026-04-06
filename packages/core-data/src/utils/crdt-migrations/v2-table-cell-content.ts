/**
 * WordPress dependencies
 */
import { type CRDTDoc, Y } from '@wordpress/sync';

/**
 * Internal dependencies
 */
import { CRDT_RECORD_MAP_KEY } from '../../sync';
import {
	getBlockAttributeSchema,
	type BlockAttributeSchema,
} from '../crdt-blocks';
import type { MigrationResult } from './index';

/**
 * Migration v1 -> v2: Fix table cell content stored as {} instead of Y.Text.
 *
 * A fixed bug (PR #76597) caused RichText content in nested block
 * attributes (e.g. table cells) to be serialized as empty objects instead of
 * Y.Text instances. This migration walks all blocks and replaces non-Y.Text
 * values with empty Y.Text('') wherever the schema declares rich-text.
 *
 * The actual cell content is restored by the existing invalidation logic in
 * _applyPersistedCrdtDoc, which compares the migrated blocks against the
 * database HTML and fills in the correct values.
 *
 * @param ydoc The CRDT document to migrate.
 */
export function migrateTableCellContent( ydoc: CRDTDoc ): MigrationResult {
	const recordMap = ydoc.getMap( CRDT_RECORD_MAP_KEY );
	const blocks = recordMap.get( 'blocks' );

	if ( ! ( blocks instanceof Y.Array ) ) {
		return 'clean';
	}

	const didRepair = migrateBlocksArray( blocks );
	return didRepair ? 'migrated' : 'clean';
}

/**
 * Recursively walk a Y.Array of blocks, repairing attributes and descending
 * into innerBlocks.
 *
 * @param blocks The Y.Array of block Y.Maps.
 */
function migrateBlocksArray( blocks: Y.Array< unknown > ): boolean {
	let repaired = false;

	for ( let i = 0; i < blocks.length; i++ ) {
		const block = blocks.get( i );

		if ( ! ( block instanceof Y.Map ) ) {
			continue;
		}

		const blockName = block.get( 'name' ) as string;
		const attributes = block.get( 'attributes' );

		if ( attributes instanceof Y.Map ) {
			if ( migrateBlockAttributes( blockName, attributes ) ) {
				repaired = true;
			}
		}

		const innerBlocks = block.get( 'innerBlocks' );

		if ( innerBlocks instanceof Y.Array ) {
			if ( migrateBlocksArray( innerBlocks ) ) {
				repaired = true;
			}
		}
	}

	return repaired;
}

/**
 * For a single block's attributes Y.Map, check each attribute against its
 * schema and repair any rich-text values that are not Y.Text.
 *
 * @param blockName  The block type name (e.g. 'core/table').
 * @param attributes The block's attributes Y.Map.
 */
function migrateBlockAttributes(
	blockName: string,
	attributes: Y.Map< unknown >
): boolean {
	let repaired = false;

	for ( const [ attrName, attrValue ] of attributes.entries() ) {
		const schema = getBlockAttributeSchema( blockName, attrName );

		if ( ! schema ) {
			continue;
		}

		// A top-level rich-text attribute that is not Y.Text.
		if (
			schema.type === 'rich-text' &&
			! ( attrValue instanceof Y.Text )
		) {
			attributes.set( attrName, new Y.Text( '' ) );
			repaired = true;
			continue;
		}

		// An array with a query schema (e.g. table body/head/foot).
		if (
			schema.type === 'array' &&
			schema.query &&
			attrValue instanceof Y.Array
		) {
			if ( migrateYArrayWithSchema( attrValue, schema.query ) ) {
				repaired = true;
			}
		}

		// An object with a query schema.
		if (
			schema.type === 'object' &&
			schema.query &&
			attrValue instanceof Y.Map
		) {
			if ( migrateYMapWithSchema( attrValue, schema.query ) ) {
				repaired = true;
			}
		}
	}

	return repaired;
}

/**
 * Walk a Y.Array whose elements are Y.Maps, checking sub-schema properties
 * for rich-text values that need repair.
 *
 * @param yArray The Y.Array to walk.
 * @param query  The query schema defining the array element properties.
 */
function migrateYArrayWithSchema(
	yArray: Y.Array< unknown >,
	query: Record< string, BlockAttributeSchema >
): boolean {
	let repaired = false;

	for ( let i = 0; i < yArray.length; i++ ) {
		const element = yArray.get( i );

		if ( ! ( element instanceof Y.Map ) ) {
			continue;
		}

		if ( migrateYMapWithSchema( element, query ) ) {
			repaired = true;
		}
	}

	return repaired;
}

/**
 * Check each property of a Y.Map against a query schema and repair rich-text
 * values or recurse into nested arrays/objects.
 *
 * @param yMap  The Y.Map to check.
 * @param query The query schema defining the map properties.
 */
function migrateYMapWithSchema(
	yMap: Y.Map< unknown >,
	query: Record< string, BlockAttributeSchema >
): boolean {
	let repaired = false;

	for ( const [ key, subSchema ] of Object.entries( query ) ) {
		const value = yMap.get( key );

		if ( subSchema.type === 'rich-text' && ! ( value instanceof Y.Text ) ) {
			yMap.set( key, new Y.Text( '' ) );
			repaired = true;
			continue;
		}

		if (
			subSchema.type === 'array' &&
			subSchema.query &&
			value instanceof Y.Array
		) {
			if ( migrateYArrayWithSchema( value, subSchema.query ) ) {
				repaired = true;
			}
		}

		if (
			subSchema.type === 'object' &&
			subSchema.query &&
			value instanceof Y.Map
		) {
			if ( migrateYMapWithSchema( value, subSchema.query ) ) {
				repaired = true;
			}
		}
	}

	return repaired;
}
