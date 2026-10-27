import { getBlockSupport } from '@wordpress/blocks';

export default function useBlockRename( name?: string | null ) {
	return {
		// The renaming support is a boolean.
		canRename: ( !! name &&
			getBlockSupport( name, 'renaming', true ) ) as boolean,
	};
}
