/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { listItem as icon } from '@wordpress/icons';
import { privateApis } from '@wordpress/block-editor';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import initBlock from '../utils/init-block';
import metadata from './block.json';
import edit from './edit';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { fieldsKey, formKey } = unlock( blocksPrivateApis );

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
	__experimentalLabel( attributes, { context } ) {
		const { content } = attributes;

		const customName = attributes?.metadata?.name;
		const hasContent = content?.trim().length > 0;

		// In the list view, use the block's content as the label.
		// If the content is empty, fall back to the default label.
		if ( context === 'list-view' && ( customName || hasContent ) ) {
			return customName || content;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}
	},
};

if ( window.__experimentalContentOnlyInspectorFields ) {
	settings[ fieldsKey ] = [
		{
			id: 'content',
			label: __( 'Content' ),
			type: 'text',
			Edit: 'rich-text', // TODO: replace with custom component
		},
	];
	settings[ formKey ] = {
		fields: [ 'content' ],
	};
}

export const init = () => initBlock( { name, metadata, settings } );
