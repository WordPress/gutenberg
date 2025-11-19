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

const { fieldsKey } = unlock( blocksPrivateApis );

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
			label: __( 'Link' ),
			type: 'Link',
			shownByDefault: true,
			mapping: {
				href: 'url',
				rel: 'rel',
			},
		},
		{
			label: __( 'Label' ),
			type: 'RichText',
			shownByDefault: false,
			mapping: {
				value: 'label',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
