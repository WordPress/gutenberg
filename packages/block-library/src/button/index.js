/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { button as icon } from '@wordpress/icons';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import deprecated from './deprecated';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import { unlock } from '../lock-unlock';

const { fieldsKey } = unlock( blocksPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	example: {
		attributes: {
			className: 'is-style-fill',
			text: __( 'Call to action' ),
		},
	},
	edit,
	save,
	deprecated,
	merge: ( a, { text = '' } ) => ( {
		...a,
		text: ( a.text || '' ) + text,
	} ),
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings[ fieldsKey ] = [
		{
			id: 'text',
			label: __( 'Content' ),
			type: 'richtext',
			shownByDefault: true,
		},
		{
			id: 'link',
			label: __( 'Link' ),
			type: 'link',
			shownByDefault: false,
			mapping: {
				url: 'url',
				rel: 'rel',
				linkTarget: 'linkTarget',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
