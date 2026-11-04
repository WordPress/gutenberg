import { listItem as icon } from '@wordpress/icons';
import { privateApis as blockEditorPrivateApis } from '@wordpress/block-editor';
import { privateApis as blocksPrivateApis } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';
import { unlock } from '../lock-unlock';

const { editableRootKey } = unlock( blocksPrivateApis );
const { requiresWrapperOnCopy } = unlock( blockEditorPrivateApis );

type DescriptionListItemAttributes = {
	content?: string | RichTextData;
	metadata?: { name?: string };
};

const { name } = metadata;

export { metadata, name };

export const settings = {
	icon,
	[ editableRootKey ]: true,
	edit,
	save,
	merge(
		attributes: DescriptionListItemAttributes,
		attributesToMerge: DescriptionListItemAttributes
	) {
		return {
			...attributes,
			content: `${ attributes.content || '' }${ attributesToMerge.content || '' }`,
		};
	},
	transforms,
	[ requiresWrapperOnCopy ]: true,
	__experimentalLabel(
		attributes: DescriptionListItemAttributes,
		{ context }: { context: string }
	) {
		const { content } = attributes;
		const customName = attributes?.metadata?.name;
		const hasContent = !! content?.toString().trim();

		if ( context === 'list-view' && ( customName || hasContent ) ) {
			return customName || content;
		}

		if ( context === 'breadcrumb' && customName ) {
			return customName;
		}

		return undefined;
	},
};

export const init = () => initBlock( { name, metadata, settings } );
