import { getBlockType, cloneBlock } from '@wordpress/blocks';
import { store as coreStore } from '@wordpress/core-data';
import { store as blockEditorStore } from '@wordpress/block-editor';
import { PATTERN_SYNC_TYPES, PATTERN_OVERRIDE_META_KEY } from '../constants';

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
 * Creates the editable copy of a registered pattern: a `wp_block` post linked to
 * the registered pattern by the `wp_pattern_slug` meta. Returns the existing
 * copy when there is one.
 *
 * @param {Object}   pattern              The registered pattern.
 * @param {string}   pattern.name         Registered pattern name.
 * @param {string}   pattern.title        Pattern title.
 * @param {string}   pattern.content      Serialized pattern content.
 * @param {string[]} [pattern.categories] Registered pattern category slugs.
 * @return {Promise<Object>} The `wp_block` record.
 */
export const createPatternOverride =
	( pattern ) =>
	async ( { registry } ) => {
		const existing = await registry
			.resolveSelect( coreStore )
			.getEntityRecords( 'postType', 'wp_block', { per_page: -1 } );
		const override = existing?.find(
			( record ) =>
				record.meta?.[ PATTERN_OVERRIDE_META_KEY ] === pattern.name
		);
		if ( override ) {
			return override;
		}

		// Map the registered categories onto user pattern categories, creating
		// terms as needed, so the copy keeps its place in the Patterns pages.
		const [ coreCategories, userCategories ] = await Promise.all( [
			registry.resolveSelect( coreStore ).getBlockPatternCategories(),
			registry.resolveSelect( coreStore ).getUserPatternCategories(),
		] );
		const categoryIds = [];
		for ( const slug of pattern.categories ?? [] ) {
			const coreCategory = coreCategories?.find(
				( { name } ) => name === slug
			);
			if ( ! coreCategory ) {
				continue;
			}
			const userCategory = userCategories?.find(
				( { label } ) =>
					label.toLowerCase() === coreCategory.label.toLowerCase()
			);
			if ( userCategory ) {
				categoryIds.push( userCategory.id );
				continue;
			}
			try {
				const term = await registry
					.dispatch( coreStore )
					.saveEntityRecord(
						'taxonomy',
						'wp_pattern_category',
						{ name: coreCategory.label, slug: coreCategory.name },
						{ throwOnError: true }
					);
				categoryIds.push( term.id );
			} catch ( error ) {
				if ( error?.code === 'term_exists' ) {
					categoryIds.push( error.data.term_id );
				} else {
					throw error;
				}
			}
		}
		if ( categoryIds.length ) {
			registry
				.dispatch( coreStore )
				.invalidateResolution( 'getUserPatternCategories' );
		}

		const record = await registry.dispatch( coreStore ).saveEntityRecord(
			'postType',
			'wp_block',
			{
				title: pattern.title,
				content: pattern.content,
				status: 'publish',
				meta: { [ PATTERN_OVERRIDE_META_KEY ]: pattern.name },
				wp_pattern_category: categoryIds,
			},
			{ throwOnError: true }
		);
		// The patterns REST endpoint now serves the copy's content.
		registry
			.dispatch( coreStore )
			.invalidateResolution( 'getBlockPatterns' );
		return record;
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
				if ( metadata ) {
					metadata = { ...metadata };
					delete metadata.id;
					delete metadata.bindings;
					// Use overridden values of the pattern block if they exist.
					if ( existingOverrides?.[ metadata.name ] ) {
						// Iterate over each overridden attribute.
						for ( const [ attributeName, value ] of Object.entries(
							existingOverrides[ metadata.name ]
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
