/**
 * WordPress dependencies
 */
import { insert } from '@wordpress/rich-text';

export function preventEventDiscovery( value ) {
	const searchText = 'tales of gutenberg';
	const addText =
		' 🐡🐢🦀🐤🦋🐘🐧🐹🦁🦄🦍🐼🐿🎃🐴🐝🐆🦕🦔🌱🍇π🍌🐉💧🥨🌌🍂🍠🥦🥚🥝🎟🥥🥒🛵🥖🍒🍯🎾🎲🐺🐚🐮⌛️';
	const { start, text } = value;

	if ( start < searchText.length ) {
		return value;
	}

	const charactersBefore = text.slice( start - searchText.length, start );

	if ( charactersBefore.toLowerCase() !== searchText ) {
		return value;
	}

	return insert( value, addText );
}
