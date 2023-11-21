/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

export default function useBlockRename( name ) {
	const metaDataSupport = getBlockSupport( name, 'renaming', true );

	const supportsBlockNaming = !! (
		true === metaDataSupport || metaDataSupport?.name
	);

	return {
		canRename: supportsBlockNaming,
	};
}
