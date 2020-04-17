/**
 * External dependencies
 */
import { concat } from 'lodash';

/**
 * WordPress dependencies
 */
import { renderToString } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';
import { isURL } from '@wordpress/url';
import { __unstableStripHTML } from '@wordpress/dom';

/**
 * Internal dependencies
 */
import { getEmbedBlockSettings } from './settings';
import { matchesPatterns } from './util';

/**
 * Default transforms for generic embeds.
 */
const transforms = {
	from: [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { content } ) =>
				isURL( __unstableStripHTML( content ).trim() ),
			transform: ( { content } ) => {
				return createBlock( 'core/embed', {
					url: __unstableStripHTML( content ).trim(),
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
 * Generate "from" transform for common/other embeds with eligibility check.
 *
 * @param  {Object} embedDefinition Embed definition.
 * @return {Array}                  "from" transform which can convert
 *                                  a paragraph block into a valid embed.
 */
const _getTransformsFrom = ( embedDefinition ) => {
	return [
		{
			type: 'block',
			blocks: [ 'core/paragraph' ],
			isMatch: ( { content } ) =>
				isURL( __unstableStripHTML( content ).trim() ) &&
				embedDefinition?.patterns &&
				matchesPatterns(
					__unstableStripHTML( content ).trim(),
					embedDefinition?.patterns
				),
			transform: ( { content } ) => {
				return createBlock( embedDefinition.name, {
					url: __unstableStripHTML( content ).trim(),
				} );
			},
		},
	];
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
					_getTransformsFrom( embedDefinition ),
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
