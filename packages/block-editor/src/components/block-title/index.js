/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Renders the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockTitle clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
 * ```
 * @param {Object} props
 * @param {string} props.clientId Client ID of block.
 * @param {string} props.title Title override.
 * @return {?string} Block title.
 */
export default function BlockTitle( { clientId, title } ) {
	const { title: blockTitle } = useSelect(
		( select ) =>
			select( 'core/blocks' ).getBlockTypeWithVariationInfo( clientId ) ||
			{},
		[ clientId ]
	);
	return title || blockTitle || null;
}
