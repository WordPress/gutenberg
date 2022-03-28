/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { quote as icon } from '@wordpress/icons';
import { addFilter } from '@wordpress/hooks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import transforms from './transforms';

const settings = {
	icon,
	example: {
		attributes: {
			citation: 'Julio Cortázar',
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'In quoting others, we cite ourselves.' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
};

export default settings;

/**
 * This function updates the attributes for the quote v2.
 * This should be moved to block.json when v2 becomes the default.
 *
 * @param {Array}  blockSettings The settings of the block to be registered.
 * @param {string} blockName     The name of the block to be registered.
 * @return {Array} New settings.
 */
function registerQuoteV2Attributes( blockSettings, blockName ) {
	if ( ! window?.__experimentalEnableQuoteBlockV2 ) {
		return blockSettings;
	}

	if ( blockName !== 'core/quote' ) {
		return blockSettings;
	}

	// Deregister the old ones.
	delete blockSettings.attributes.value;

	return blockSettings;
}

// Importing this file includes side effects.
// This has been declared in block-library/package.json under sideEffects.
addFilter(
	'blocks.registerBlockType',
	'core/quote/v2-attributes',
	registerQuoteV2Attributes
);
