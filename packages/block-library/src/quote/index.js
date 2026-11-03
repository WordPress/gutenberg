import { __ } from '@wordpress/i18n';
import { quote as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

const TEMPLATE = [ [ 'core/paragraph', {} ] ];

export const settings = {
	icon,
	example: {
		attributes: {
			citation: __( 'Julio Cortázar' ),
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: __( 'In quoting others, we cite ourselves.' ),
				},
			},
		],
	},
	transforms,
	template: TEMPLATE,
	templateInsertUpdatesSelection: true,
	edit,
	save,
	deprecated,
};

export const init = () => initBlock( { name, metadata, settings } );
