import { postDate as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import deprecated from './deprecated';
import variations from './variations';
import { unlock } from '../lock-unlock';

const { insertAttributesKey } = unlock( blocksPrivateApis );

const { name } = metadata;
export { metadata, name };

export const settings = {
	icon,
	edit,
	deprecated,
	variations,
	// Save the date of insertion, so the block isn't read as the legacy one,
	// which shows the post's date.
	[ insertAttributesKey ]: ( attributes ) =>
		attributes.datetime || attributes.metadata?.bindings?.datetime
			? {}
			: { datetime: new Date().toISOString() },
};

export const init = () => initBlock( { name, metadata, settings } );
