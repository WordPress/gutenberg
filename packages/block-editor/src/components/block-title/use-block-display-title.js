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
 * Returns the block's configured title as a string, or empty if the title
 * cannot be determined.
 *
 * @example
 *
 * ```js
 * useBlockDisplayTitle( 'afd1cb17-2c08-4e7a-91be-007ba7ddc3a1', 17 );
 * ```
 *
 * @param {string}           clientId      Client ID of block.
 * @param {number|undefined} maximumLength The maximum length that the block title string may be before truncated.
 * @return {?string} Block title.
 */
export default function useBlockDisplayTitle( clientId, maximumLength ) {
	const blockTitle = useSelect(
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
			const blockLabel = blockType
				? getBlockLabel( blockType, attributes )
				: null;
			const displayLabel = reusableBlockTitle || blockLabel;
			return displayLabel && displayLabel !== blockType.title
				? displayLabel
				: null;
		},
		[ clientId ]
	);

	const blockInformation = useBlockDisplayInformation( clientId );
	if ( ! blockInformation ) {
		return null;
	}
	// const blockType = getBlockType( name );
	// const blockLabel = blockType
	// 	? getBlockLabel( blockType, attributes )
	// 	: null;
	//
	// const label = reusableBlockTitle || blockLabel;
	// Label will fallback to the title if no label is defined for the current
	// label context. If the label is defined we prioritize it over a
	// possible block variation title match.
	const blockDisplayTitle = blockTitle || blockInformation.title;

	if ( maximumLength && maximumLength > 0 ) {
		return truncate( blockDisplayTitle, { length: maximumLength } );
	}

	return blockDisplayTitle;
}
