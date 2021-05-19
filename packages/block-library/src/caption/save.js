/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	return (
		<figcaption { ...useBlockProps.save() }>
			<RichText.Content value={ attributes.content } />
		</figcaption>
	);
}
