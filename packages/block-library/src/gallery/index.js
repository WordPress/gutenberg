import { gallery as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import variations from './variations';
import { LINK_DESTINATION_NONE } from './constants';
import { unlock } from '../lock-unlock';

const { insertAttributesKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			columns: 2,
		},
		innerBlocks: [
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Glacial_lakes%2C_Bhutan.jpg',
				},
			},
			{
				name: 'core/image',
				attributes: {
					url: 'https://s.w.org/images/core/5.3/Sediment_off_the_Yucatan_Peninsula.jpg',
				},
			},
		],
	},
	transforms,
	variations,
	edit,
	save,
	deprecated,
	// Save the site's default link, so changing image_default_link_type later
	// doesn't change existing galleries.
	[ insertAttributesKey ]: ( attributes ) =>
		attributes.linkTo
			? {}
			: {
					linkTo:
						window?.wp?.media?.view?.settings?.defaultProps?.link ||
						LINK_DESTINATION_NONE,
				},
};

export const init = () => initBlock( { name, metadata, settings } );
