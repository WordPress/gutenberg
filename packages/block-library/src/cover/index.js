import { __ } from '@wordpress/i18n';
import { cover as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import variations from './variations';
import { DEFAULT_MEDIA_SIZE_SLUG } from './constants';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			customOverlayColor: '#065174',
			dimRatio: 40,
			url: 'https://s.w.org/images/core/5.3/Windbuchencom.jpg',
			style: {
				typography: {
					fontSize: 48,
				},
				color: {
					text: 'white',
				},
			},
		},
		innerBlocks: [
			{
				name: 'core/paragraph',
				attributes: {
					content: `<strong>${ __( 'Snow Patrol' ) }</strong>`,
					style: {
						typography: {
							textAlign: 'center',
						},
					},
				},
			},
		],
	},
	mediaEditor: {
		getMedia: ( { id, url } ) => ( { id, url } ),
		applyMedia: ( attributes, media ) => ( {
			id: media.id,
			url: media.source_url,
			sizeSlug: DEFAULT_MEDIA_SIZE_SLUG,
		} ),
	},
	transforms,
	save,
	edit,
	deprecated,
	variations,
};

export const init = () => initBlock( { name, metadata, settings } );
