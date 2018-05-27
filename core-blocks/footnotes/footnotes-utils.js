/**
 * External dependencies
 */
import { get } from 'lodash';

/**
 * Given an array of footnotes and a UID, returns the footnote object associated
 * with that UID. If the array doesn't contain the footnote, a footnote object is
 * returned with the given ID and an empty text.
 *
 * @param {Array} footnotes   Array of footnotes.
 * @param {Array} footnoteUID UID of the footnote to return.
 *
 * @return {Object} Footnote object with the id and the text of the footnote. If
 * the footnote doesn't exist in the array, the text is an empty string.
 */
const getFootnoteByUid = function( footnotes, footnoteUID ) {
	const filteredFootnotes = footnotes.filter(
		( footnote ) => footnote.id === footnoteUID );

	return get( filteredFootnotes, [ 0 ], { id: footnoteUID, text: '' } );
};

/**
 * Orders an array of footnotes based on another array with the footnote UIDs
 * ordered.
 *
 * @param {Array} footnotes            Array of unordered footnotes.
 * @param {Array} orderedFootnotesUids Array of ordered footnotes UIDs. Every
 * element of the array must be an object with an id property, like the one
 * returned after parsing the attributes.
 *
 * @return {Array} Array of footnotes ordered.
 */
const orderFootnotes = function( footnotes, orderedFootnotesUids ) {
	return orderedFootnotesUids.map(
		( { id } ) => getFootnoteByUid( footnotes, id ) );
};

export { getFootnoteByUid, orderFootnotes };
