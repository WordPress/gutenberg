/**
 * External dependencies
 */
import { truncate } from 'lodash';

/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';
import {
	getBlockType,
	__experimentalGetBlockLabel as getBlockLabel,
} from '@wordpress/blocks';

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
	const { attributes, name } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return {};
			}
			const { getBlockName, getBlockAttributes } = select(
				'core/block-editor'
			);
			return {
				attributes: getBlockAttributes( clientId ),
				name: getBlockName( clientId ),
			};
		},
		[ clientId ]
	);

	const blockInformation = useSelect(
		( select ) => {
			if ( ! ( name && attributes ) ) return null;
			const { getBlockDisplayInformation } = select( 'core/blocks' );
			return getBlockDisplayInformation( name, attributes );
		},
		[ name, attributes ]
	);
	if ( ! blockInformation ) return null;
	const blockType = getBlockType( name );
	const label = getBlockLabel( blockType, attributes );
	// Label will fallback to the title if no label is defined for the
	// current label context. We do not want "Paragraph: Paragraph".
	// If label is defined we prioritize it over possible possible
	// block variation match title.
	if ( label !== blockType.title ) {
		return `${ blockType.title }: ${ truncate( label, { length: 15 } ) }`;
	}
	return blockInformation.title;
}
