/**
 * Internal dependencies
 */
import { common as commonEmbeds, others as otherEmbeds } from './core-embeds';
import { embedContentIcon } from './icons';
import { getEmbedBlockSettings } from './settings';
import transforms from './transforms';

/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

export const name = 'core/embed';

export const settings = getEmbedBlockSettings( {
	title: _x( 'Embed', 'block title' ),
	description: __(
		'Embed videos, images, tweets, audio, and other content from external sources.'
	),
	icon: embedContentIcon,
	// Unknown embeds should not be responsive by default.
	responsive: false,
	transforms,
} );

export const common = commonEmbeds.map( ( embedDefinition ) => {
	const embedSettings = getEmbedBlockSettings( embedDefinition.settings );
	return {
		...embedDefinition,
		settings: {
			...embedSettings,
			transforms,
		},
	};
} );

export const others = otherEmbeds.map( ( embedDefinition ) => {
	const embedSettings = getEmbedBlockSettings( embedDefinition.settings );
	return {
		...embedDefinition,
		settings: {
			...embedSettings,
			transforms,
		},
	};
} );
