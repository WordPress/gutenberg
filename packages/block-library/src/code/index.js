/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { code as icon } from '@wordpress/icons';
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
	example: {
		attributes: {
			/* eslint-disable @wordpress/i18n-no-collapsible-whitespace */
			// translators: Preserve \n markers for line breaks
			content: __(
				'// A “block” is the abstract term used\n// to describe units of markup that\n// when composed together, form the\n// content or layout of a page.\nregisterBlockType( name, settings );'
			),
			/* eslint-enable @wordpress/i18n-no-collapsible-whitespace */
		},
	},
	merge( attributes, attributesToMerge ) {
		return {
			content: attributes.content + '\n\n' + attributesToMerge.content,
		};
	},
	transforms,
	edit,
	save,
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'content',
			label: __( 'Code' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
	];
	settings[ formKey ] = {
		fields: [ 'content' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
