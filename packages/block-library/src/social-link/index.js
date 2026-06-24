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
			type: 'url',
			Edit: 'link', // TODO: replace with custom component
			getValue: ( { item } ) => ( {
				url: item.url,
				rel: item.rel,
			} ),
			setValue: ( { value } ) => ( {
				url: value.url,
				rel: value.rel,
			} ),
		},
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'text',
		},
	];
	settings[ formKey ] = {
		fields: [ 'link', 'label' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
