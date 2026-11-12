import { _x } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';
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
			href: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg',
			fileName: _x( 'Armstrong_Small_Step', 'Name of the file' ),
		},
	},
	transforms,
	deprecated,
	edit,
	save,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
