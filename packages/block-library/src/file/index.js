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
			type: 'media',
			Edit: {
				control: 'media', // TODO: replace with custom component
				allowedTypes: [],
				multiple: false,
			},
			getValue: ( { item } ) => ( {
				id: item.id,
				url: item.href,
			} ),
			setValue: ( { value } ) => ( {
				id: value.id,
				href: value.url,
			} ),
		},
		{
			id: 'fileName',
			label: __( 'Filename' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
		{
			id: 'downloadButtonText',
			label: __( 'Button Text' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
	];
	settings[ formKey ] = {
		fields: [ 'file', 'fileName', 'downloadButtonText' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
