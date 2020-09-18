/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, content } = attributes;

	return (
		<RichText.Content
			tagName="p"
			style={ { textAlign: align } }
			value={ content }
		/>
	);
}
