// @ts-expect-error `@wordpress/block-editor` does not expose type declarations for its entry point.
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
		<dd { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
		</dd>
	);
}
