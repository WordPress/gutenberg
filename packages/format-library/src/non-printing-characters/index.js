/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { store as preferencesStore } from '@wordpress/preferences';

const name = 'core/non-printing-characters';
const title = __( 'Non-printing character' );

/**
 * Every character that gets a marker, paired with the kind of marker it gets.
 * The kind ends up in the `data-rich-text-non-printing-character` attribute,
 * which the editor content styles use to draw the marker.
 *
 * Characters are listed by code point rather than as literals, so that reading
 * this file never depends on being able to see the characters it is about.
 *
 * Zero width joiners (U+200D) and non joiners (U+200C) are deliberately absent.
 * They hold emoji sequences together and carry meaning in Arabic, Persian and
 * several Indic scripts, so marking them would flag correct text as suspect.
 *
 * U+FEFF and U+FFFC are absent too: rich text writes them itself as padding and
 * as the placeholder for objects, so they are never part of the author's text.
 *
 * @type {Array<[number, string]>}
 */
const CHARACTER_CODE_POINTS = [
	// Ordinary whitespace.
	[ 0x0020, 'space' ], // Space.
	[ 0x0009, 'tab' ], // Character tabulation.
	[ 0x000a, 'line-break' ], // Line feed.

	// Spaces that read like an ordinary space but never break. These are the
	// ones that arrive by accident, pasted in from a word processor.
	[ 0x00a0, 'non-breaking-space' ], // No-break space.
	[ 0x202f, 'non-breaking-space' ], // Narrow no-break space.
	[ 0x2007, 'non-breaking-space' ], // Figure space.

	// Fixed width spaces from the general punctuation block.
	[ 0x2000, 'space' ], // En quad.
	[ 0x2001, 'space' ], // Em quad.
	[ 0x2002, 'space' ], // En space.
	[ 0x2003, 'space' ], // Em space.
	[ 0x2004, 'space' ], // Three-per-em space.
	[ 0x2005, 'space' ], // Four-per-em space.
	[ 0x2006, 'space' ], // Six-per-em space.
	[ 0x2008, 'space' ], // Punctuation space.
	[ 0x2009, 'space' ], // Thin space.
	[ 0x200a, 'space' ], // Hair space.
	[ 0x3000, 'space' ], // Ideographic space.

	// Characters with no width at all, which nothing else can reveal.
	[ 0x200b, 'zero-width' ], // Zero width space.
	[ 0x2060, 'zero-width' ], // Word joiner.
	[ 0x00ad, 'zero-width' ], // Soft hyphen.
];

const CHARACTER_TYPES = new Map(
	CHARACTER_CODE_POINTS.map( ( [ codePoint, characterType ] ) => [
		String.fromCodePoint( codePoint ),
		characterType,
	] )
);

/**
 * Builds the marker format for a single character.
 *
 * Each character gets its own object rather than a shared one, because the tree
 * builder reuses an element whenever adjacent characters point at the same
 * format reference. Sharing would collapse a run of spaces into one element
 * carrying one marker, when a run of three spaces should show three.
 *
 * @param {string} characterType The kind of marker to draw.
 *
 * @return {Object} A rich text format object.
 */
function createFormat( characterType ) {
	return {
		type: name,
		attributes: { characterType },
	};
}

export const nonPrintingCharacters = {
	name,
	title,
	tagName: 'span',
	className: 'rich-text-non-printing-character',
	attributes: {
		characterType: 'data-rich-text-non-printing-character',
	},
	interactive: false,
	object: false,
	edit: () => null,
	__experimentalGetPropsForEditableTreePreparation( select ) {
		return {
			isEnabled: !! select( preferencesStore ).get(
				'core',
				'showNonPrintingCharacters'
			),
		};
	},
	__experimentalCreatePrepareEditableTree( { isEnabled } ) {
		return ( formats, text ) => {
			if ( ! isEnabled ) {
				return formats;
			}

			let newFormats;

			for ( let index = 0; index < text.length; index++ ) {
				const characterType = CHARACTER_TYPES.get( text[ index ] );

				if ( ! characterType ) {
					continue;
				}

				// Only pay for a copy once we know there is something to mark.
				newFormats = newFormats || formats.slice();
				newFormats[ index ] = [
					...( newFormats[ index ] || [] ),
					createFormat( characterType ),
				];
			}

			return newFormats || formats;
		};
	},
};
