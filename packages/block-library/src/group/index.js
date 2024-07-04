/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { group as icon } from '@wordpress/icons';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import variations from './variations';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			layout: {
				type: 'constrained',
				justifyContent: 'center',
			},
			style: {
				spacing: {
					padding: {
						top: '1em',
						right: '1em',
						bottom: '1em',
						left: '1em',
					},
				},
			},
		},
		innerBlocks: [
			{
				name: 'core/heading',
				attributes: {
					content: __( 'La Mancha' ),
					textAlign: 'center',
				},
			},
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
				},
			},
			{
				name: 'core/paragraph',
				attributes: {
					align: 'center',
					content: __(
						'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
					),
				},
			},
			{
				name: 'core/button',
				attributes: {
					text: __( 'Read more' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
	deprecated,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
