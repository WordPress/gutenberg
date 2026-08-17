import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<dd { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
		</dd>
	);
}
