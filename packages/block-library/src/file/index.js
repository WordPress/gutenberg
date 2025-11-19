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

const { fieldsKey } = unlock( blocksPrivateApis );

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

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			label: __( 'File' ),
			type: 'Media',
			shownByDefault: true,
			mapping: {
				id: 'id',
				src: 'href',
			},
			args: {
				allowedTypes: [],
				multiple: false,
			},
		},
		{
			label: __( 'Filename' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'fileName',
			},
		},
		{
			label: __( 'Button Text' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'downloadButtonText',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
