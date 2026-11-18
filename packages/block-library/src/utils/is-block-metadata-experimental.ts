/**
 * Checks if the block is experimental based on the metadata loaded
 * from block.json.
 *
 * @param {Object} metadata Parsed block.json metadata.
 * @return Is the block experimental?
 */
export default function isBlockMetadataExperimental(
	metadata: Record< string, unknown > | undefined
): boolean | undefined {
	return (
		metadata &&
		'__experimental' in metadata &&
		metadata.__experimental !== false
	);
}
