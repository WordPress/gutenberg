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
import { store as blockEditorStore } from '../../store';

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
	const blockInformation = useBlockDisplayInformation( clientId );
	const title = useSelect(
		( select ) => {
			if ( ! clientId ) {
				return null;
			}

			const {
				getBlockName,
				getBlockAttributes,
				__experimentalGetReusableBlockTitle,
			} = select( blockEditorStore );
			const blockName = getBlockName( clientId );

			if ( ! blockName ) {
				return null;
			}

			const blockType = getBlockType( blockName );
			const isReusable = isReusableBlock( blockType );
			const attributes = getBlockAttributes( clientId );
			const reusableBlockTitle =
				isReusable &&
				__experimentalGetReusableBlockTitle( attributes.ref );
			const label =
				reusableBlockTitle || getBlockLabel( blockType, attributes );

			// Label will fallback to the title if no label is defined for the
			// current label context. If the label is defined we prioritize it
			// over possible possible block variation title match.
			if ( label === blockType.title ) {
				return null;
			}

			return truncate( label, { length: 35 } );
		},
		[ clientId ]
	);

	return title || blockInformation.title;
}
