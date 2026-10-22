import { getBlockType, cloneBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { parseInnerBlocksOverride } from '../api';
import {
	PATTERN_OVERRIDES_BINDING_SOURCE,
	PATTERN_SYNC_TYPES,
} from '../constants';

/**
 * Returns a generator converting one or more static blocks into a pattern, or creating a new empty pattern.
 *
 * @param {string}             title        Pattern title.
 * @param {'full'|'unsynced'}  syncType     They way block is synced, 'full' or 'unsynced'.
 * @param {string|undefined}   [content]    Optional serialized content of blocks to convert to pattern.
 * @param {number[]|undefined} [categories] Ids of any selected categories.
 */
export const createPattern =
	( title, syncType, content, categories ) =>
	async ( { registry } ) => {
		const meta =
			syncType === PATTERN_SYNC_TYPES.unsynced
				? {
						wp_pattern_sync_status: syncType,
					}
				: undefined;

		const reusableBlock = {
			title,
			content,
			status: 'publish',
			meta,
			wp_pattern_category: categories,
		};

		const updatedRecord = await registry
			.dispatch( coreStore )
			.saveEntityRecord( 'postType', 'wp_block', reusableBlock );

		return updatedRecord;
	};

/**
 * Create a pattern from a JSON file.
 * @param {File}               file         The JSON file instance of the pattern.
 * @param {number[]|undefined} [categories] Ids of any selected categories.
 */
export const createPatternFromFile =
	( file, categories ) =>
	async ( { dispatch } ) => {
		const fileContent = await file.text();
		/** @type {import('./types').PatternJSON} */
		let parsedContent;
		try {
			parsedContent = JSON.parse( fileContent );
		} catch {
			throw new Error( 'Invalid JSON file' );
		}
		if (
			parsedContent.__file !== 'wp_block' ||
			! parsedContent.title ||
			! parsedContent.content ||
			typeof parsedContent.title !== 'string' ||
			typeof parsedContent.content !== 'string' ||
			( parsedContent.syncStatus &&
				typeof parsedContent.syncStatus !== 'string' )
		) {
			throw new Error( 'Invalid pattern JSON file' );
		}

		const pattern = await dispatch.createPattern(
			parsedContent.title,
			parsedContent.syncStatus,
			parsedContent.content,
			categories
		);

		return pattern;
	};

/**
 * Returns a generator converting a synced pattern block into a static block.
 *
 * @param {string} clientId The client ID of the block to attach.
 */
export const convertSyncedPatternToStatic =
	( clientId ) =>
	( { registry } ) => {
		const patternBlock = registry
			.select( blockEditorStore )
			.getBlock( clientId );
		const existingOverrides = patternBlock.attributes?.content;

		function cloneBlocksAndRemoveBindings( blocks ) {
			return blocks.map( ( block ) => {
				let metadata = block.attributes.metadata;
				let overriddenInnerBlocks;
				if ( metadata ) {
					const { bindings } = metadata;
					metadata = { ...metadata };
					delete metadata.id;
					delete metadata.bindings;
					// Use overridden values of the pattern block if they exist.
					if ( existingOverrides?.[ metadata.name ] ) {
						// Iterate over each overridden attribute.
						for ( const [ attributeName, value ] of Object.entries(
							existingOverrides[ metadata.name ]
						) ) {
							// Skip the inner blocks, and attributes that don't exist in the block type.
							if (
								attributeName === 'innerBlocks' ||
								! getBlockType( block.name )?.attributes[
									attributeName
								]
							) {
								continue;
							}
							// Update the block attribute with the override value.
							block.attributes[ attributeName ] = value;
						}
						if (
							bindings?.innerBlocks?.source ===
							PATTERN_OVERRIDES_BINDING_SOURCE
						) {
							overriddenInnerBlocks = parseInnerBlocksOverride(
								existingOverrides[ metadata.name ].innerBlocks
							);
						}
					}
				}
				return cloneBlock(
					block,
					{
						metadata:
							metadata && Object.keys( metadata ).length > 0
								? metadata
								: undefined,
					},
					// The overridden inner blocks hold their own values, so the
					// other overrides of the instance don't apply to them.
					overriddenInnerBlocks ??
						cloneBlocksAndRemoveBindings( block.innerBlocks )
				);
			} );
		}

		const patternInnerBlocks = registry
			.select( blockEditorStore )
			.getBlocks( patternBlock.clientId );

		registry
			.dispatch( blockEditorStore )
			.replaceBlocks(
				patternBlock.clientId,
				cloneBlocksAndRemoveBindings( patternInnerBlocks )
			);
	};

/**
 * Returns an action descriptor for SET_EDITING_PATTERN action.
 *
 * @param {string}  clientId  The clientID of the pattern to target.
 * @param {boolean} isEditing Whether the block should be in editing state.
 * @return {Object} Action descriptor.
 */
export function setEditingPattern( clientId, isEditing ) {
	return {
		type: 'SET_EDITING_PATTERN',
		clientId,
		isEditing,
	};
}
