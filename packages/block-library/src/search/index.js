/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { search as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import variations from './variations';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: { buttonText: __( 'Search' ), label: __( 'Search' ) },
		viewportWidth: 400,
	},
	variations,
	edit,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'label',
			label: __( 'Label' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
		{
			id: 'buttonText',
			label: __( 'Button text' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
		{
			id: 'placeholder',
			label: __( 'Placeholder' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
	];
	settings[ formKey ] = {
		fields: [ 'label', 'buttonText', 'placeholder' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
