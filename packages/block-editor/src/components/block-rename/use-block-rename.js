/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

export default function useBlockRename( name ) {
	return {
		canRename: getBlockSupport( name, 'renaming', true ),
	};
}
