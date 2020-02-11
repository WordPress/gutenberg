/**
 * WordPress dependencies
 */
import { RichText } from '@wordpress/block-editor';

export default function save( { attributes } ) {
	const { ordered, values, type, reversed, start } = attributes;
	const tagName = ordered ? 'ol' : 'ul';

	return (
		<RichText.Content
			tagName={ tagName }
			value={ values }
			type={ type }
			reversed={ reversed }
			start={ start }
			multiline="li"
		/>
	);
}
