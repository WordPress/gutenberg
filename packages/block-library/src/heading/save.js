/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, level, content } = attributes;
	const tagName = 'h' + level;

	return (
		<RichText.Content
			tagName={ tagName }
			style={ { textAlign: align } }
			value={ content }
		/>
	);
}
