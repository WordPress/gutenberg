/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values, reversed, start, type } = attributes;
	const tagName = ordered ? 'ol' : 'ul';

	return (
		<RichText.Content tagName={ tagName } value={ values } reversed={ reversed } start={ start } type={ type } className={ ( ordered && type ) ? 'ol-type-is-' + type : undefined } multiline="li" />
	);
}
