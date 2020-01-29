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
import { createBlock } from '@wordpress/blocks';

export const name = 'core/embed';

export const settings = getEmbedBlockSettings( {
	title: _x( 'Embed', 'block title' ),
	description: __( 'Embed videos, images, tweets, audio, and other content from external sources.' ),
	icon: embedContentIcon,
	// Unknown embeds should not be responsive by default.
	responsive: false,
	transforms: {
		from: [
			{
				type: 'raw',
				// Internally, a figure schema will ensure embed elements are
				// taken out of paragraphs where appropriate.
				schema: ( { phrasingContentSchema } ) => ( {
					figure: {
						require: [ 'embed' ],
						children: {
							embed: { attributes: [ 'src' ] },
							figcaption: {
								children: phrasingContentSchema,
							},
						},
					},
				} ),
				isMatch: ( node ) => (
					node.nodeName === 'FIGURE' &&
					!! node.querySelector( 'embed' )
				) || (
					node.nodeName === 'P' &&
					/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent )
				),
				transform: ( node ) => {
					let url;

					if ( node.nodeName === 'FIGURE' ) {
						url = node
							.querySelector( 'embed' )
							.getAttribute( 'src' );
					} else {
						url = node.textContent.trim();
					}

					return createBlock( 'core/embed', { url } );
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
