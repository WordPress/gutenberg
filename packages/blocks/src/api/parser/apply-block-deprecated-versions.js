/**
 * External dependencies
 */
import { omit, stubFalse, castArray } from 'lodash';

/**
 * Internal dependencies
 */
import { DEPRECATED_ENTRY_KEYS } from '../constants';
import { validateBlock } from '../validation';
import { getBlockAttributes } from './get-block-attributes';
import { applyBuiltInValidationFixes } from './apply-built-in-validation-fixes';

/**
 * Given a block object, returns a new copy of the block with any applicable
 * deprecated migrations applied, or the original block if it was both valid
 * and no eligible migrations exist.
 *
 * @param {import(".").WPBlock}                   block     Parsed and invalid block object.
 * @param {import(".").WPRawBlock}                rawBlock  Raw block object.
 * @param {import('../registration').WPBlockType} blockType Block type. This is normalize not necessary and
 *                                                          can be inferred from the block name,
 *                                                          but it's here for performance reasons.
 *
 * @return {import(".").WPBlock} Migrated block object.
 */
export function applyBlockDeprecatedVersions( block, rawBlock, blockType ) {
	const parsedAttributes = rawBlock.attrs;
	const { deprecated: deprecatedDefinitions } = blockType;
	// Bail early if there are no registered deprecations to be handled.
	if ( ! deprecatedDefinitions || ! deprecatedDefinitions.length ) {
		return block;
	}

	// By design, blocks lack any sort of version tracking. Instead, to process
	// outdated content the system operates a queue out of all the defined
	// attribute shapes and tries each definition until the input produces a
	// valid result. This mechanism seeks to avoid polluting the user-space with
	// machine-specific code. An invalid block is thus a block that could not be
	// matched successfully with any of the registered deprecation definitions.
	for ( let i = 0; i < deprecatedDefinitions.length; i++ ) {
		// A block can opt into a migration even if the block is valid by
		// defining `isEligible` on its deprecation. If the block is both valid
		// and does not opt to migrate, skip.
		const { isEligible = stubFalse } = deprecatedDefinitions[ i ];
		if (
			block.isValid &&
			! isEligible( parsedAttributes, block.innerBlocks )
		) {
			continue;
		}

		// Block type properties which could impact either serialization or
		// parsing are not considered in the deprecated block type by default,
		// and must be explicitly provided.
		const deprecatedBlockType = Object.assign(
			omit( blockType, DEPRECATED_ENTRY_KEYS ),
			deprecatedDefinitions[ i ]
		);

		let migratedBlock = {
			...block,
			attributes: getBlockAttributes(
				deprecatedBlockType,
				block.originalContent,
				parsedAttributes
			),
		};

		// Ignore the deprecation if it produces a block which is not valid.
		let [ isValid ] = validateBlock( migratedBlock, deprecatedBlockType );

		// If the migrated block is not valid initially, try the built-in fixes.
		if ( ! isValid ) {
			migratedBlock = applyBuiltInValidationFixes(
				migratedBlock,
				deprecatedBlockType
			);
			[ isValid ] = validateBlock( migratedBlock, deprecatedBlockType );
		}

		// An invalid block does not imply incorrect HTML but the fact block
		// source information could be lost on re-serialization.
		if ( ! isValid ) {
			continue;
		}

		let migratedInnerBlocks = migratedBlock.innerBlocks;
		let migratedAttributes = migratedBlock.attributes;

		// A block may provide custom behavior to assign new attributes and/or
		// inner blocks.
		const { migrate } = deprecatedBlockType;
		if ( migrate ) {
			[
				migratedAttributes = parsedAttributes,
				migratedInnerBlocks = block.innerBlocks,
			] = castArray( migrate( migratedAttributes, block.innerBlocks ) );
		}

		block = {
			...block,
			attributes: migratedAttributes,
			innerBlocks: migratedInnerBlocks,
			isValid: true,
			validationIssues: [],
		};
	}

	return block;
}
