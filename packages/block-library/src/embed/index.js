/**
 * Internal dependencies
 */
import { common as commonEmbeds, others as otherEmbeds } from './core-embeds';
import { embedContentIcon } from './icons';
import { getEmbedBlockSettings } from './settings';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

export const name = 'core/embed';

export const settings = getEmbedBlockSettings( {
	name,
	settings: {
		title: _x( 'Embed', 'block title' ),
		description: __( 'Embed videos, images, tweets, audio, and other content from external sources.' ),
		icon: embedContentIcon,
		// Unknown embeds should not be responsive by default.
		responsive: false,
	},
	patterns: [],
} );

export const common = commonEmbeds.map(
	( embedDefinition ) => {
		return {
			...embedDefinition,
			settings: getEmbedBlockSettings( embedDefinition ),
		};
	}
);

export const others = otherEmbeds.map(
	( embedDefinition ) => {
		return {
			...embedDefinition,
			settings: getEmbedBlockSettings( embedDefinition ),
		};
	}
);
