import { getBlockType, cloneBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import type { Block } from '@wordpress/blocks';
import { parseInnerBlocksOverride } from '../api';
import {
	PATTERN_OVERRIDES_BINDING_SOURCE,
	PATTERN_SYNC_TYPES,
} from '../constants';
import type { BlockMetadata } from '../types';
import type {
	PatternJSON,
	PatternOverrides,
	PatternsThunkArgs,
	SetEditingPatternAction,
} from './types';

/**
 * How many overridden inner blocks can be nested, as on the server.
 */
const MAX_NESTED_INNER_BLOCKS_OVERRIDES = 8;

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
		// The blocks whose inner blocks can be bound, as in the editor.
		const supportedAttributes = registry
			.select( blockEditorStore )
			.getSettings().__experimentalBlockBindingsSupportedAttributes as
			Record< string, Array< string > > | undefined;

		/**
		 * Clones blocks with the overrides of the pattern instance applied,
		 * and without bindings.
		 *
		 * The blocks of overridden inner blocks belong to the instance: as in
		 * the editor and on the frontend, only the ones bound to pattern
		 * overrides take its overrides, and their other bindings stay.
		 *
		 * @param blocks         The blocks.
		 * @param ancestorValues The serialized overridden inner blocks the
		 *                       blocks are nested in.
		 *
		 * @return The cloned blocks.
		 */
		function cloneBlocksAndRemoveBindings(
			blocks: Array< Block >,
			ancestorValues: Array< string > = []
		): Array< Block > {
			const isOverriddenInnerBlocks = ancestorValues.length > 0;
			return blocks.map( ( block ) => {
				// Block attributes are untyped; every block may carry `metadata`.
				let metadata = block.attributes.metadata as
					BlockMetadata | undefined;
				let overriddenInnerBlocks: Array< Block > | undefined;
				if ( metadata ) {
					const { bindings } = metadata;
					metadata = { ...metadata };
					delete metadata.id;
					delete metadata.bindings;
					const otherBindings = Object.entries(
						bindings ?? {}
					).filter(
						( [ , binding ] ) =>
							binding?.source !== PATTERN_OVERRIDES_BINDING_SOURCE
					);
					if ( isOverriddenInnerBlocks && otherBindings.length ) {
						metadata.bindings = Object.fromEntries( otherBindings );
					}
					const isOverridable =
						! isOverriddenInnerBlocks ||
						otherBindings.length <
							Object.keys( bindings ?? {} ).length;
					// Use overridden values of the pattern block if they exist.
					// A block without a name reads the `undefined` key.
					if (
						isOverridable &&
						existingOverrides?.[ metadata.name as string ]
					) {
						// Iterate over each overridden attribute.
						for ( const [ attributeName, value ] of Object.entries(
							// Checked above, under the same possibly `undefined` key.
							existingOverrides[ metadata.name as string ]
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
						const innerBlocksValue =
							existingOverrides[ metadata.name as string ]
								.innerBlocks;
						// As on the server, overridden inner blocks aren't
						// expanded inside themselves, nor nested too deep: the
						// block keeps its own inner blocks instead.
						const parsedInnerBlocks =
							typeof innerBlocksValue === 'string' &&
							bindings?.innerBlocks?.source ===
								PATTERN_OVERRIDES_BINDING_SOURCE &&
							supportedAttributes?.[ block.name ]?.includes(
								'innerBlocks'
							) &&
							ancestorValues.length <
								MAX_NESTED_INNER_BLOCKS_OVERRIDES &&
							! ancestorValues.includes( innerBlocksValue )
								? parseInnerBlocksOverride( innerBlocksValue )
								: undefined;
						if ( parsedInnerBlocks ) {
							// The blocks inside them are overridden too.
							overriddenInnerBlocks =
								cloneBlocksAndRemoveBindings(
									parsedInnerBlocks,
									// Only a string is parsed.
									[
										...ancestorValues,
										innerBlocksValue as string,
									]
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
					overriddenInnerBlocks ??
						cloneBlocksAndRemoveBindings(
							block.innerBlocks,
							ancestorValues
						)
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
