import { RichText, useBlockProps } from '@wordpress/block-editor';
import type { BlockSaveProps } from '@wordpress/blocks';
import type { RichTextData } from '@wordpress/rich-text';

type DescriptionListItemAttributes = {
	content: string | RichTextData;
	placeholder?: string;
};

export default function save( {
	attributes,
}: BlockSaveProps< DescriptionListItemAttributes > ) {
	return (
		<dt { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
		</dt>
	);
}
