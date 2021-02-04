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
	isReusableBlock,
} from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import useBlockDisplayInformation from '../use-block-display-information';

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
	const { attributes, name, reusableBlockTitle } = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return {};
			}
			const {
				getBlockName,
				getBlockAttributes,
				__experimentalGetReusableBlockTitle,
			} = select( 'core/block-editor' );
			const blockName = getBlockName( clientId );
			if ( ! blockName ) {
				return {};
			}
			const isReusable = isReusableBlock( getBlockType( blockName ) );
			return {
				attributes: getBlockAttributes( clientId ),
				name: blockName,
				reusableBlockTitle:
					isReusable &&
					__experimentalGetReusableBlockTitle(
						getBlockAttributes( clientId ).ref
					),
			};
		},
		[ clientId ]
	);

	const blockInformation = useBlockDisplayInformation( clientId );
	if ( ! name || ! blockInformation ) return null;
	const blockType = getBlockType( name );
	const label = reusableBlockTitle || getBlockLabel( blockType, attributes );
	// Label will fallback to the title if no label is defined for the current
	// label context. If the label is defined we prioritize it over possible
	// possible block variation title match.
	if ( label !== blockType.title ) {
		return truncate( label, { length: 35 } );
	}
	return blockInformation.title;
}
