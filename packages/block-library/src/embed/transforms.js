/**
 * External dependencies
 */
import { concat } from 'lodash';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { getEmbedBlockSettings } from './settings';

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'raw',
			isMatch: ( node ) =>
				node.nodeName === 'P' &&
				/^\s*(https?:\/\/\S+)\s*$/i.test( node.textContent ),
			transform: ( node ) => {
				return createBlock( 'core/embed', {
					url: node.textContent.trim(),
				} );
			},
		},
	],
	to: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			transform: ( { url, caption } ) => {
				const link = <a href={ url }>{ caption || url }</a>;
				return createBlock( 'core/paragraph', {
					content: renderToString( link ),
				} );
			},
		},
	],
};

/**
 * Merge default transforms with the embed (common/other) specific transforms.
 *
 * @param  {Object} embedDefinition Embed definition.
 * @return {Object}                 Updated Embed definition with all the transforms together.
 */
export const _mergeTransforms = ( embedDefinition ) => {
	const embedSettings = getEmbedBlockSettings( embedDefinition.settings );
	return {
		...embedDefinition,
		settings: {
			...embedSettings,
			transforms: {
				from: concat(
					transforms?.from ?? [],
					embedSettings?.transforms?.from ?? []
				).filter( Boolean ),
				to: concat(
					transforms?.to ?? [],
					embedSettings?.transforms?.to ?? []
				).filter( Boolean ),
			},
		},
	};
};

export default transforms;
