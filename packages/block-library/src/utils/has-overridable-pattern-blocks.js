/**
 * Returns whether a synced pattern contains content that its instance can
 * override. Structural bindings are considered only while the private
 * inner-blocks feature is enabled, and only named pattern-overrides areas
 * participate in core/block's Reset action.
 *
 * @param {Object[]} blocks  Pattern blocks.
 * @param {Object}   options Detection dependencies.
 * @return {boolean} Whether the pattern contains overridable content.
 */
export default function hasOverridablePatternBlocks( blocks, options ) {
	const { innerBlocks, getBinding, isOverridable, supportedTypes } = options;
	return blocks.some( ( block ) => {
		if (
			innerBlocks &&
			typeof block.attributes?.metadata?.name === 'string' &&
			block.attributes.metadata.name !== '' &&
			getBinding( block.attributes, block.name )?.source ===
				'core/pattern-overrides'
		) {
			return true;
		}
		if ( supportedTypes.includes( block.name ) && isOverridable( block ) ) {
			return true;
		}
		return hasOverridablePatternBlocks( block.innerBlocks, {
			innerBlocks,
			getBinding,
			isOverridable,
			supportedTypes,
		} );
	} );
}
