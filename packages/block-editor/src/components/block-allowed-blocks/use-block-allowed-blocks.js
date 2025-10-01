/**
 * WordPress dependencies
 */
import { getBlockSupport } from '@wordpress/blocks';

export default function useBlockAllowedBlocks( name ) {
	return {
		canControlAllowedBlocks: getBlockSupport(
			name,
			'allowedBlocks',
			false
		),
	};
}
