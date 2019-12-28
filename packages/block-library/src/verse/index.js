/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import deprecated from './deprecated';
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Verse' ),
	description: __( 'Insert poetry. Use special spacing formats. Or quote song lyrics.' ),
	icon,
	example: {
		attributes: {
			// translators: Sample content for the Verse block. Can be replaced with a more locale-adequate work.
			content: __( 'WHAT was he doing, the great god Pan,\n	Down in the reeds by the river?\nSpreading ruin and scattering ban,\nSplashing and paddling with hoofs of a goat,\nAnd breaking the golden lilies afloat\n    With the dragon-fly on the river.' ),
		},
	},
	keywords: [ __( 'poetry' ), __( 'poem' ) ],
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
