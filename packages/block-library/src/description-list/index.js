import { __ } from '@wordpress/i18n';
import { list as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [ [ 'core/description-term' ], [ 'core/description-detail' ] ];

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/description-term',
				attributes: { content: __( 'Term' ) },
			},
			{
				name: 'core/description-detail',
				attributes: { content: __( 'Description' ) },
			},
		],
	},
	template: TEMPLATE,
	templateInsertUpdatesSelection: true,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
