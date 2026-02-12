/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import icon from './icon';

const { name } = metadata;
export { metadata, name };
export const settings = {
	icon,
	example: {
		attributes: {
			icon: 'core/audio',
			style: {
				dimensions: {
					width: '48px',
				},
			},
		},
	},
	edit,
};

export const init = () => initBlock( { name, metadata, settings } );
