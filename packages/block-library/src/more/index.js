/**
 * WordPress dependencies
 */
import { more as icon } from '@wordpress/icons';
import { __ } from '@wordpress/i18n';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
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
	example: {},
	__experimentalLabel( attributes, { context } ) {
		const customName = attributes?.metadata?.name;

		if ( context === 'list-view' && customName ) {
			return customName;
		}

		if ( context === 'accessibility' ) {
			return attributes.customText;
		}
	},
	transforms,
	edit,
	save,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'customText',
			label: __( 'Content' ),
			type: 'richtext',
		},
	];
	settings[ formKey ] = {
		fields: [ 'customText' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
