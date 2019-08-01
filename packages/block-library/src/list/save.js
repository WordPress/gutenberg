/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values } = attributes;
	const tagName = ordered ? 'ol' : 'ul';

	return (
		<RichText.Content tagName={ tagName } value={ values } multiline="li" />
	);
}
