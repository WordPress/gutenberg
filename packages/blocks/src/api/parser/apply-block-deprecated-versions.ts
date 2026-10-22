import { DEPRECATED_ENTRY_KEYS } from '../constants';
import { validateBlock, VALIDATION_LEVEL } from '../validation';
import { getBlockAttributes } from './get-block-attributes';
import { applyBuiltInValidationFixes } from './apply-built-in-validation-fixes';
import { omit } from '../utils';
import type { Block, BlockDeprecation, BlockType, RawBlock } from '../../types';

/**
 * Function that takes no arguments and always returns false.
 *
 * @return Always returns false.
 */
function stubFalse(): boolean {
	return false;
}

/**
 * Given a block object, returns a new copy of the block with any applicable
 * deprecated migrations applied, or the original block if it was both valid
 * and no eligible migrations exist.
 *
 * A deprecation with a `save` function applies when its output matches the
 * stored markup exactly, or, for a valid block, when its `isEligible` function
 * opts in. A deprecation without a `save` function (an attribute-only
 * deprecation) never matches markup: it applies when its `isEligible` function
 * opts in and the markup the current block type generates from the migrated
 * attributes preserves the stored content. Without a `save` signature nothing
 * ties the stored markup to the deprecated schema, so the check happens on the
 * result instead.
 *
 * @param block     Parsed block object, validated against the current block type.
 * @param rawBlock  Raw block object.
 * @param blockType Block type. This is normalize not necessary and
 *                  can be inferred from the block name,
 *                  but it's here for performance reasons.
 *
 * @return Migrated block object.
 */
export function applyBlockDeprecatedVersions(
	block: Block,
	rawBlock: RawBlock,
	blockType: BlockType
): Block {
	const parsedAttributes = rawBlock.attrs ?? {};
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
		const { isEligible = stubFalse, save } = deprecatedDefinitions[ i ];
		const isAttributeOnly = ! save;

		// A deprecation with a `save` function is tried by markup match on an
		// invalid block, and on a valid block only when its `isEligible`
		// function opts in. An attribute-only deprecation never matches
		// markup: it applies only by opting in, and only if the block it
		// produces preserves the stored content (checked below).
		if (
			( block.isValid || isAttributeOnly ) &&
			! ( isEligible as Function )( parsedAttributes, block.innerBlocks, {
				blockNode: rawBlock,
				block,
			} )
		) {
			continue;
		}

		// Block type properties which could impact either serialization or
		// parsing are not considered in the deprecated block type by default,
		// and must be explicitly provided. Deprecations require a perfect
		// match: unlike parsing, where automated reconstruction is acceptable,
		// they are explicit author instructions that should only apply when
		// the old `save` output matches the stored content exactly, so
		// reconstruction is disabled (which also skips its comparisons).
		const deprecatedBlockType = Object.assign(
			omit(
				blockType as unknown as Record< string, unknown >,
				DEPRECATED_ENTRY_KEYS
			),
			deprecatedDefinitions[ i ],
			{ allowsReconstruction: false }
		) as unknown as BlockType;

		let migratedBlock = {
			...block,
			attributes: getBlockAttributes(
				deprecatedBlockType,
				block.originalContent ?? '',
				parsedAttributes
			),
		};

		if ( ! isAttributeOnly ) {
			let [ , , metadata ] = validateBlock(
				migratedBlock,
				deprecatedBlockType
			);
			let isValidDeprecation =
				metadata.validationLevel === VALIDATION_LEVEL.VALID_BLOCK;

			// If the migrated block is not valid initially, try the built-in fixes.
			if ( ! isValidDeprecation ) {
				migratedBlock = applyBuiltInValidationFixes(
					migratedBlock,
					deprecatedBlockType
				);
				[ , , metadata ] = validateBlock(
					migratedBlock,
					deprecatedBlockType
				);
				isValidDeprecation =
					metadata.validationLevel === VALIDATION_LEVEL.VALID_BLOCK;
			}

			// An invalid block does not imply incorrect HTML but the fact block
			// source information could be lost on re-serialization. We continue to
			// the next deprecation to see if the block becomes valid.
			if ( ! isValidDeprecation ) {
				continue;
			}
		}

		let migratedInnerBlocks = migratedBlock.innerBlocks;
		let migratedAttributes = migratedBlock.attributes;

		// A block may provide custom behavior to assign new attributes and/or
		// inner blocks.
		const { migrate } = deprecatedBlockType as unknown as BlockDeprecation;
		if ( migrate ) {
			let migrated = migrate( migratedAttributes, block.innerBlocks );
			if ( ! Array.isArray( migrated ) ) {
				migrated = [ migrated ] as unknown as [
					Record< string, unknown >,
					Block[],
				];
			}

			[
				migratedAttributes = parsedAttributes,
				migratedInnerBlocks = block.innerBlocks,
			] = migrated;
		}

		// An attribute-only deprecation has no `save` function to tie the
		// stored markup to its attributes, so the check happens on its
		// result: the markup the current block type generates from the
		// migrated attributes must preserve the stored content (any level
		// but invalid). This is what lets such a deprecation rescue an
		// invalid block when its attributes source what the current ones no
		// longer do, and what rejects an `isEligible` that opted in wrongly.
		if ( isAttributeOnly ) {
			const [ , , { validationLevel } ] = validateBlock(
				{
					...block,
					attributes: migratedAttributes,
					innerBlocks: migratedInnerBlocks,
				},
				blockType
			);
			if ( validationLevel === VALIDATION_LEVEL.INVALID_BLOCK ) {
				continue;
			}
		}

		block = {
			...block,
			attributes: migratedAttributes,
			innerBlocks: migratedInnerBlocks,
			isValid: true,
			validationIssues: [],
			validationLevel: VALIDATION_LEVEL.MIGRATED_BLOCK,
		};
	}

	return block;
}
