/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { RawHTML } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Page Break' ),

	description: __( 'Separate your content into a multi-page experience.' ),

	icon,

	keywords: [ __( 'next page' ), __( 'pagination' ) ],

	supports: {
		customClassName: false,
		className: false,
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'raw',
				schema: {
					'wp-block': { attributes: [ 'data-block' ] },
				},
				isMatch: ( node ) => node.dataset && node.dataset.block === 'core/nextpage',
				transform() {
					return createBlock( 'core/nextpage', {} );
				},
			},
		],
	},

	edit,

	save() {
		return (
			<RawHTML>
				{ '<!--nextpage-->' }
			</RawHTML>
		);
	},
};
