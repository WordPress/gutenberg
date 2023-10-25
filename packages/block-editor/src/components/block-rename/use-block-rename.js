/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

export function useBlockRename( name ) {
	const metaDataSupport = getBlockSupport(
		name,
		'__experimentalMetadata',
		false
	);

	const supportsBlockNaming = !! (
		true === metaDataSupport || metaDataSupport?.name
	);

	return {
		canRename: supportsBlockNaming,
	};
}
