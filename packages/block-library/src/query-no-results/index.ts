import { __ } from '@wordpress/i18n';
import { loop as icon } from '@wordpress/icons';
import type { TemplateItem } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import save from './save';

const TEMPLATE: TemplateItem[] = [
	[
		'core/paragraph',
		{
			placeholder: __(
				'Add text or blocks that will display when a query returns no results.'
			),
		},
	],
];

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule[ 'settings' ] = {
	icon,
	template: TEMPLATE,
	edit,
	save,
	example: {
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'No posts were found.' ),
				},
			},
		],
	},
};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as unknown as BlockModule[ 'metadata' ],
		settings,
	} );
