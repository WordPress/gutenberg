import { createInterpolateElement } from '@wordpress/element';

/**
 * Puts a menu's name into a sentence, in bold, so it reads as a name and
 * not as part of the sentence (a menu called "Main" or "Footer links" is
 * easily mistaken for ordinary words).
 *
 * The name fills a `<menu />` tag in the translated string, rather than
 * being part of the string, so a name with `<` in it is shown as it is.
 *
 * @param {string} text Translated text with a `<menu />` tag.
 * @param {string} name The menu's name.
 * @return {Element} The sentence.
 */
export default function withMenuName( text, name ) {
	return createInterpolateElement( text, {
		menu: <strong>{ name }</strong>,
	} );
}
