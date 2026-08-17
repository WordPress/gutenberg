import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<dt { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
		</dt>
	);
}
