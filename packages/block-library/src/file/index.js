/**
 * WordPress dependencies
 */
import { _x, __ } from '@wordpress/i18n';
import { file as icon } from '@wordpress/icons';
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
			href: 'https://upload.wikimedia.org/wikipedia/commons/d/dd/Armstrong_Small_Step.ogg',
			fileName: _x( 'Armstrong_Small_Step', 'Name of the file' ),
		},
	},
	transforms,
	deprecated,
	edit,
	save,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'file',
			label: __( 'File' ),
			Edit: 'media',
			type: 'object',
			properties: {
				id: {
					id: 'id',
					type: 'number',
					label: __( 'Id' ),
				},
				url: {
					id: 'href',
					type: 'url',
					label: __( 'Url' ),
				},
			},
			args: {
				allowedTypes: [],
				multiple: false,
			},
		},
		{
			id: 'fileName',
			label: __( 'Filename' ),
			Edit: 'richtext',
			type: 'string',
		},
		{
			id: 'downloadButtonText',
			label: __( 'Button Text' ),
			Edit: 'richtext',
			type: 'string',
		},
	];
	settings[ formKey ] = {
		fields: [ 'file' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
