import { __ } from '@wordpress/i18n';
import { link as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import type { BlockModule } from '../utils/types';
import metadata from './block.json';
import edit from './edit';
import type { ReadMoreAttributes } from './types';

const { name } = metadata;
export { metadata, name };

export const settings: BlockModule< ReadMoreAttributes >[ 'settings' ] = {
	icon,
	edit,
	example: {
		attributes: {
			// @ts-expect-error Fixed in #87543 (`BlockConfiguration['example']['attributes']`).
			content: __( 'Read more' ),
		},
	},
};

export const init = () =>
	initBlock( {
		name,
		metadata: metadata as BlockModule< ReadMoreAttributes >[ 'metadata' ],
		settings,
	} );
