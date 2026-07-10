/**
 * WordPress dependencies
 */
import { __, sprintf } from '@wordpress/i18n';
import { tabs as icon } from '@wordpress/icons';

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
		innerBlocks: [
			{
				name: 'core/tab-list',
				attributes: {
					tabs: [
						{ label: __( 'Tab 1' ) },
						{ label: __( 'Tab 2' ) },
					],
				},
			},
			{
				name: 'core/tab-panels',
				innerBlocks: [ 1, 2 ].map( ( index ) => ( {
					name: 'core/tab-panel',
					attributes: {
						anchor: `tab-${ index }`,
						label: sprintf(
							/** translators: %s: tab index number */
							__( 'Tab %s' ),
							index
						),
					},
					innerBlocks: [
						{
							name: 'core/paragraph',
							attributes: {
								content: __(
									'In a village of La Mancha, the name of which I have no desire to call to mind, there lived not long since one of those gentlemen that keep a lance in the lance-rack, an old buckler, a lean hack, and a greyhound for coursing.'
								),
							},
						},
					],
				} ) ),
			},
		],
	},
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
