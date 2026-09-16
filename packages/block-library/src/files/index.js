import { _x } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

const { name } = metadata;

export { metadata, name };

const exampleFileURL =
	'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg';

export const settings = {
	icon,
	example: {
		innerBlocks: [
			{
				name: 'core/file',
				attributes: {
					href: exampleFileURL,
					fileName: _x( 'Armstrong_Small_Step', 'Name of the file' ),
					downloadButtonText: _x( 'Download', 'button label' ),
				},
			},
			{
				name: 'core/file',
				attributes: {
					href: exampleFileURL,
					fileName: _x( 'Transcript', 'Name of the file' ),
					downloadButtonText: _x( 'Download', 'button label' ),
				},
			},
		],
	},
	transforms,
	edit,
	save,
};

export const init = () => initBlock( { name, metadata, settings } );
