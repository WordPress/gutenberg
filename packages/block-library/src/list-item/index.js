/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { listItem as icon } from '@wordpress/icons';
import { privateApis } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	edit,
	save,
	merge( attributes, attributesToMerge ) {
		return {
			...attributes,
			content: attributes.content + attributesToMerge.content,
		};
	},
	transforms,
	[ unlock( privateApis ).requiresWrapperOnCopy ]: true,
};

if ( window.__experimentalContentOnlyPatternInsertion ) {
	settings.fields = [
		{
			label: __( 'Content' ),
			type: 'RichText',
			shownByDefault: true,
			mapping: {
				value: 'content',
			},
		},
	];
}

export const init = () => initBlock( { name, metadata, settings } );
