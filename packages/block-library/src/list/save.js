/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { align, ordered, values } = attributes;
	const tagName = ordered ? 'ol' : 'ul';
	const styles = {
		textAlign: align,
		listStylePosition: 'inside',
	};

	return (
		<RichText.Content tagName={ tagName } style={ styles } value={ values } multiline="li" />
	);
}
