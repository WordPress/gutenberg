/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import { getBlockType } from '@wordpress/blocks';

/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
 * ```
 *
 * @param {Object} props
 * @param {string} props.clientId Client ID of block.
 *
 * @return {?string} Block title.
 */
export default function BlockTitle( { clientId } ) {
	const name = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}
			const { getBlockName } = select( 'core/block-editor' );
			return getBlockName( clientId );
		},
		[ clientId ]
	);

	if ( ! name ) {
		return null;
	}

	const blockType = getBlockType( name );
	if ( ! blockType ) {
		return null;
	}

	return blockType.title;
}
