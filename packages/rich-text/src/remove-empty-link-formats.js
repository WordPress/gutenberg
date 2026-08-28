import { OBJECT_REPLACEMENT_CHARACTER } from './special-characters';

/** @typedef {import('./types').RichTextValue} RichTextValue */

/**
 * @param {Object|null|undefined} format A rich text format or replacement.
 * @return {boolean} Whether the format represents a link.
 */
export function isLinkFormat( format ) {
	if ( ! format ) {
		return false;
	}

	return (
		format.type === 'core/link' ||
		format.type === 'a' ||
		format.tagName === 'a'
	);
}

/**
 * @param {Object|null|undefined} replacement A rich text replacement.
 * @return {boolean} Whether the replacement is an empty link.
 */
export function isEmptyLinkReplacement( replacement ) {
	if ( ! isLinkFormat( replacement ) ) {
		return false;
	}

	if ( replacement.innerHTML ) {
		return false;
	}

	return true;
}

/**
 * @param {RichTextValue} value Value to inspect.
 * @return {boolean} Whether the value contains an empty link replacement.
 */
function hasEmptyLinkReplacement( value ) {
	const { text, replacements } = value;

	for ( let index = 0; index < text.length; index++ ) {
		if (
			text[ index ] === OBJECT_REPLACEMENT_CHARACTER &&
			isEmptyLinkReplacement( replacements[ index ] )
		) {
			return true;
		}
	}

	return false;
}

/**
 * Remove empty link object replacements from a rich text value.
 *
 * @param {RichTextValue} value Value to clean up.
 * @return {RichTextValue} A new value with empty links removed.
 */
export function removeEmptyLinkFormats( value ) {
	if ( ! value?.text || ! hasEmptyLinkReplacement( value ) ) {
		return value;
	}

	const { text, formats, replacements, start, end } = value;
	let removedBeforeStart = 0;
	let removedBeforeEnd = 0;
	const newText = [];
	const newFormats = [];
	const newReplacements = [];

	for ( let index = 0; index < text.length; index++ ) {
		const character = text[ index ];
		const replacement = replacements[ index ];

		if (
			character === OBJECT_REPLACEMENT_CHARACTER &&
			isEmptyLinkReplacement( replacement )
		) {
			if ( start !== undefined ) {
				if ( index < start ) {
					removedBeforeStart++;
				}
				if ( index < end ) {
					removedBeforeEnd++;
				}
			}
			continue;
		}

		newText.push( character );

		const formatIndex = newFormats.length;
		const format = formats[ index ];
		const nextReplacement = replacements[ index ];

		if ( format ) {
			newFormats[ formatIndex ] = format;
		}

		if ( nextReplacement ) {
			newReplacements[ formatIndex ] = nextReplacement;
		}
	}

	const nextValue = {
		...value,
		text: newText.join( '' ),
		formats: newFormats,
		replacements: newReplacements,
	};

	if ( start !== undefined ) {
		nextValue.start = start - removedBeforeStart;
		nextValue.end = end - removedBeforeEnd;
	}

	return nextValue;
}
