/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import icon from './icon';
import variations from './variations';

const { name } = metadata;
export { metadata, name };
export const settings = {
	icon,
	example: {
		attributes: {
			icon: 'core/info',
			style: {
				dimensions: {
					width: '48px',
				},
			},
		},
	},
	variations,
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
