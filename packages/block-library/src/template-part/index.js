/**
 * External dependencies
 */
import { startCase } from 'lodash';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import metadata from './block.json';
import edit from './edit';

const { name } = metadata;
export { metadata, name };

export const settings = {
	title: __( 'Template Part' ),
	keywords: [ __( 'template part' ) ],
	__experimentalLabel: ( { slug } ) => startCase( slug ),
	edit,
	transforms: {
		from: [
			{
				type: 'block',
				isMultiBlock: true,
				blocks: [ '*' ],
				__experimentalConvert( blocks ) {
					// Avoid transforming a single `core/template-part` block.
					if ( blocks.length === 1 && blocks[ 0 ].name === name ) {
						return;
					}

					return createBlock(
						name,
						{},
						blocks.map( ( block ) =>
							createBlock(
								block.name,
								block.attributes,
								block.innerBlocks
							)
						)
					);
				},
			},
		],
	},
};
