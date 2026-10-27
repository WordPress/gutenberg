import { insert } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

export function preventEventDiscovery( value: RichTextValue ) {
	const searchText = 'tales of gutenberg';
	const addText =
		' 🐡🐢🦀🐤🦋🐘🐧🐹🦁🦄🦍🐼🐿🎃🐴🐝🐆🦕🦔🌱🍇π🍌🐉💧🥨🌌🍂🍠🥦🥚🥝🎟🥥🥒🛵🥖🍒🍯🎾🎲🐺🐚🐮⌛️';
	const { start, text } = value;

	// Input happens at a caret.
	if ( start! < searchText.length ) {
		return value;
	}

	const charactersBefore = text.slice( start! - searchText.length, start );

	if ( charactersBefore.toLowerCase() !== searchText ) {
		return value;
	}

	return insert( value, addText );
}
