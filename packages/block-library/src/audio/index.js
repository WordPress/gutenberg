/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { audio as icon } from '@wordpress/icons';
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

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			src: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg',
		},
		viewportWidth: 350,
	},
	transforms,
	deprecated,
	edit,
	save,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'audio',
			label: __( 'Audio' ),
			type: 'media',
			mapping: {
				id: 'id',
				url: 'src',
			},
			args: {
				allowedTypes: [ 'audio' ],
				multiple: false,
			},
		},
		{
			id: 'caption',
			label: __( 'Caption' ),
			type: 'richtext',
		},
	];
	settings[ formKey ] = {
		fields: [ 'audio' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
