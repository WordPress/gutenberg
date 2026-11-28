import { layout } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const { name } = metadata;
export { metadata, name };

const TEMPLATE = [
	[ 'core/post-title' ],
	[
		'core/post-date',
		{
			metadata: {
				bindings: {
					datetime: {
						source: 'core/post-data',
						args: { field: 'date' },
					},
				},
			},
		},
	],
	[ 'core/post-excerpt' ],
];

export const settings = {
	icon: layout,
	template: TEMPLATE,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
