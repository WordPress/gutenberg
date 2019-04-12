/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

export const settings = {
	title: __( 'Group' ),
	icon,
	description: __( 'A block that groups other blocks.' ),
	keywords: [ __( 'container' ), __( 'wrapper' ), __( 'row' ), __( 'section' ) ],
	supports: {
		align: [ 'wide', 'full' ],
		anchor: true,
		html: false,
	},

	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ '*' ],
				transform: ( attributes, innerBlocks, names ) => {
					const groupInnerBlocks = attributes.map( ( attrs, index ) => {
						return createBlock( names[ index ], attrs, innerBlocks[ index ] );
					} );

					return createBlock( 'core/group', {
						backgroundColor: 'lighter-blue', // TODO: remove this once https://github.com/WordPress/gutenberg/pull/14241 is activated on `core/group`
					}, groupInnerBlocks );
				},
			},

		],
	},

	edit,
	save,
};
