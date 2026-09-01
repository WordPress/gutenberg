import { __ } from '@wordpress/i18n';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [
	[
		'core/buttons',
		{},
		[
			[
				'core/button',
				{
					text: __( 'Submit' ),
					tagName: 'button',
					type: 'submit',
				},
			],
		],
	],
];

export const settings = {
	template: TEMPLATE,
	edit,
	save,
	example: {},
};

export const init = () => initBlock( { name, metadata, settings } );
