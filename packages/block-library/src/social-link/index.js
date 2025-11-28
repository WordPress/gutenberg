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

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'link',
			mapping: {
				href: 'url',
				rel: 'rel',
			},
		},
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'richtext',
		},
	];
	settings[ formKey ] = {
		fields: [ 'link' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
