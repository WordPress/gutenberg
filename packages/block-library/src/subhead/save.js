/**
 * WordPress dependencies
 */
import { RichText, useBlockProps } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, content } = attributes;

	return (
		<p { ...useBlockProps.save( { style: { textAlign: align } } ) }>
			<RichText.Content value={ content } />
		</p>
	);
}
