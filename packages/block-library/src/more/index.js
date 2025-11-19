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

const { fieldsKey } = unlock( blocksPrivateApis );

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

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			label: __( 'Content' ),
			type: 'RichText',
			shownByDefault: true,
			mapping: {
				value: 'customText',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
