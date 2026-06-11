/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { gallery as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import save from './save';
import metadata from './block.json';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		innerBlocks: [ 1, 2 ].map( ( index ) => ( {
			name: 'core/slide',
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: __( 'Slide' ) + ` ${ index }`,
					},
				},
				{
					name: 'core/paragraph',
					attributes: {
						content: __(
							'Add any blocks you like inside each authored slide.'
						),
					},
				},
			],
		} ) ),
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
