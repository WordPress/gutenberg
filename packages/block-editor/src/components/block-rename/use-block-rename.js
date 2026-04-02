/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

export default function useBlockRename( name ) {
	return {
		canRename: !! name && getBlockSupport( name, 'renaming', true ),
	};
}
