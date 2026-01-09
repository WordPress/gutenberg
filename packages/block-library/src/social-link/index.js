/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { share as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import variations from './variations';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	variations,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'link',
			label: __( 'Link' ),
			Edit: 'link',
			type: 'group',
			properties: {
				href: {
					id: 'url',
					type: 'url',
					label: __( 'Url' ),
				},
				rel: {
					id: 'rel',
					type: 'text',
					label: __( 'Rel' ),
				},
			},
		},
		{
			id: 'label',
			label: __( 'Label' ),
			Edit: 'richtext',
			type: 'string',
		},
	];
	settings[ formKey ] = {
		fields: [ 'link' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
