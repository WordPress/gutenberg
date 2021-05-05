/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { verse as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			/* eslint-disable @wordpress/i18n-no-collapsible-whitespace */
			// translators: Sample content for the Verse block. Can be replaced with a more locale-adequate work.
			content: __(
				'WHAT was he doing, the great god Pan,\n	Down in the reeds by the river?\nSpreading ruin and scattering ban,\nSplashing and paddling with hoofs of a goat,\nAnd breaking the golden lilies afloat\n    With the dragon-fly on the river.'
			),
			/* eslint-enable @wordpress/i18n-no-collapsible-whitespace */
		},
	},
	transforms,
	deprecated,
	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + attributesToMerge.content,
		};
	},
	edit,
	save,
};
