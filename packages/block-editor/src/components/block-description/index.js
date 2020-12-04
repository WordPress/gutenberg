/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Renders the block's configured description as a string, or empty if the description
 * cannot be determined.
 *
 * @example
 *
 * ```jsx
 * <BlockDescription clientId="afd1cb17-2c08-4e7a-91be-007ba7ddc3a1" />
 * ```
 * ```jsx
 * <BlockDescription description="Override description" />
 * ```
 * @param {Object} props
 * @param {string} props.clientId Client ID of block.
 * @param {string} props.description Description override.
 * @return {?string} Block Description.
 */
export default function BlockDescription( { clientId, description } ) {
	const { description: blockDescription } = useSelect(
		( select ) =>
			select( 'core/blocks' ).getBlockTypeWithVariationInfo( clientId ) ||
			{},
		[ clientId ]
	);
	return description || blockDescription || null;
}
