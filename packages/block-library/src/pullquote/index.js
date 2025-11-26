/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { pullquote as icon } from '@wordpress/icons';
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
			value:
				// translators: Quote serving as example for the Pullquote block. Attributed to Matt Mullenweg.
				__(
					'One of the hardest things to do in technology is disrupt yourself.'
				),
			citation: __( 'Matt Mullenweg' ),
		},
	},
	transforms,
	edit,
	save,
	deprecated,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			id: 'value',
			label: __( 'Content' ),
			type: 'richtext',
		},
		{
			id: 'citation',
			label: __( 'Citation' ),
			type: 'richtext',
		},
	];
	settings[ formKey ] = {
		fields: [ 'value' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
