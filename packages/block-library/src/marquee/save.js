/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { content } = attributes;

	return (
		<marquee>
			<RichText.Content value={ content } />
		</marquee>
	);
}
