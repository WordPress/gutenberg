import { listItem as icon } from '@wordpress/icons';
import initBlock from '../utils/init-block';
import edit from './edit';
import metadata from './block.json';
import save from './save';
import transforms from './transforms';

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
