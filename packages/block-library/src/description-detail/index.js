import { listItem as icon } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { editableRootKey } = unlock( blocksPrivateApis );
const { requiresWrapperOnCopy } = unlock( blockEditorPrivateApis );

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	[ editableRootKey ]: true,
	edit,
	save,
	merge( attributes, attributesToMerge ) {
		return {
			...attributes,
			content: attributes.content + attributesToMerge.content,
		};
	},
	transforms,
	[ requiresWrapperOnCopy ]: true,
	__experimentalLabel( attributes, { context } ) {
		const { content } = attributes;
		const customName = attributes?.metadata?.name;
		const hasContent = content?.trim().length > 0;

		if ( context === 'list-view' && ( customName || hasContent ) ) {
			return customName || content;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}
	},
};

export const init = () => initBlock( { name, metadata, settings } );
