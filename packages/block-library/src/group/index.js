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
						top: '4em',
						right: '3em',
						bottom: '4em',
						left: '3em',
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
				name: 'core/paragraph',
				attributes: {
					align: 'center',
					content: __(
						'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
					),
				},
			},
			{
				name: 'core/spacer',
				attributes: {
					height: '10px',
				},
			},
			{
				name: 'core/button',
				attributes: {
					text: __( 'Read more' ),
				},
			},
		],
		viewportWidth: 600,
	},
	transforms,
	edit,
	save,
	deprecated,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
