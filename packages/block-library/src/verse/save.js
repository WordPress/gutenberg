/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { textAlign, content } = attributes;

	return (
		<RichText.Content
			tagName="pre"
			style={ { textAlign } }
			value={ content }
		/>
	);
}
