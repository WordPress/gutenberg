/**
 * Internal dependencies
 */
import { common as commonEmbeds, others as otherEmbeds } from './core-embeds';
import { embedContentIcon } from './icons';
import { getEmbedBlockSettings } from './settings';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

export const name = 'core/embed';

export const settings = getEmbedBlockSettings( {
	title: __( 'Embed' ),
	description: __( 'The Embed block allows you to easily add videos, images, tweets, audio, and other content to your post or page.' ),
	icon: embedContentIcon,
	// Unknown embeds should not be responsive by default.
	responsive: false,
	transforms: {
		from: [
			{
				type: 'raw',
				isMatch: ( node ) => node.nodeName === 'P' && /^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
				transform: ( node ) => {
					return createBlock( 'core/embed', {
						url: node.textContent.trim(),
					} );
				},
			},
		],
	},
} );

export const common = commonEmbeds.map(
	( embedDefinition ) => {
		return {
			...embedDefinition,
			settings: getEmbedBlockSettings( embedDefinition.settings ),
		};
	}
);

export const others = otherEmbeds.map(
	( embedDefinition ) => {
		return {
			...embedDefinition,
			settings: getEmbedBlockSettings( embedDefinition.settings ),
		};
	}
);
