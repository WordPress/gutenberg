import { getBlockType, cloneBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';
import { PATTERN_SYNC_TYPES } from '../constants';
import type { BlockMetadata } from '../types';
import type {
	PatternJSON,
	PatternOverrides,
	PatternsThunkArgs,
	SetEditingPatternAction,
} from './types';

/**
 * Returns a generator converting one or more static blocks into a pattern, or creating a new empty pattern.
 *
 * @param title      Pattern title.
 * @param syncType   They way block is synced, 'fully' or 'unsynced'.
 * @param content    Optional serialized content of blocks to convert to pattern.
 * @param categories Ids of any selected categories.
 */
export const createPattern =
	(
		title: string,
		syncType: string | undefined,
		content?: string,
		categories?: Array< number >
	) =>
	async ( { registry }: PatternsThunkArgs ) => {
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
 * @param file       The JSON file instance of the pattern.
 * @param categories Ids of any selected categories.
 */
export const createPatternFromFile =
	( file: File, categories?: Array< number > ) =>
	async ( { dispatch }: PatternsThunkArgs ) => {
		const fileContent = await file.text();
		let parsedContent: PatternJSON;
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
 * @param clientId The client ID of the block to attach.
 */
export const convertSyncedPatternToStatic =
	( clientId: string ) =>
	( { registry }: PatternsThunkArgs ) => {
		// The action converts a pattern block that is in the editor.
		const patternBlock = registry
			.select( blockEditorStore )
			.getBlock( clientId )!;
		// The pattern block keeps each named block's overridden attributes.
		const existingOverrides = patternBlock.attributes?.content as
			PatternOverrides | undefined;

		function cloneBlocksAndRemoveBindings(
			blocks: Array< Block >
		): Array< Block > {
			return blocks.map( ( block ) => {
				// Block attributes are untyped; every block may carry `metadata`.
				let metadata = block.attributes.metadata as
					BlockMetadata | undefined;
				if ( metadata ) {
					metadata = { ...metadata };
					delete metadata.id;
					delete metadata.bindings;
					// Use overridden values of the pattern block if they exist.
					// A block without a name reads the `undefined` key.
					if ( existingOverrides?.[ metadata.name as string ] ) {
						// Iterate over each overridden attribute.
						for ( const [ attributeName, value ] of Object.entries(
							// Checked above, under the same possibly `undefined` key.
							existingOverrides[ metadata.name as string ]
						) ) {
							// Skip if the attribute does not exist in the block type.
							if (
								! getBlockType( block.name )?.attributes[
									attributeName
								]
							) {
								continue;
							}
							// Update the block attribute with the override value.
							block.attributes[ attributeName ] = value;
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
 * @param clientId  The clientID of the pattern to target.
 * @param isEditing Whether the block should be in editing state.
 * @return Action descriptor.
 */
export function setEditingPattern(
	clientId: string,
	isEditing: boolean
): SetEditingPatternAction {
	return {
		type: 'SET_EDITING_PATTERN',
		clientId,
		isEditing,
	};
}
