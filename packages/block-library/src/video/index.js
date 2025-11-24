/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { video as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			src: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Wood_thrush_in_Central_Park_switch_sides_%2816510%29.webm',
			// translators: Caption accompanying a video of the wood thrush singing, which serves as an example for the Video block.
			caption: __( 'Wood thrush singing in Central Park, NYC.' ),
		},
	},
	transforms,
	deprecated,
	edit,
	save,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			id: 'video',
			label: __( 'Video' ),
			type: 'media',
			shownByDefault: true,
			mapping: {
				id: 'id',
				url: 'src',
				caption: 'caption',
				poster: 'poster',
			},
			args: {
				allowedTypes: [ 'video' ],
				multiple: false,
			},
		},
		{
			id: 'caption',
			label: __( 'Caption' ),
			type: 'richtext',
			shownByDefault: false,
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
