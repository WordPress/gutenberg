/**
 * Internal dependencies
 */
import { getTokenCount } from './token-count';

/**
 * Returns a sprintf like string token (eg %1$s) incrementing the numeral
 * each time it's called.
 *
 * Note: to reset the count, you must call `resetTokenCount`.
 *
 * @return {string}  A sprintf like token.
 */
const getFormatToken = () => {
	return '%' + getTokenCount( 'sprintf' ) + '$s';
};

/**
 * Generates and returns tags to use for the provided type.
 *
 * - search string for the given tag type (i.e. `a%1`), with an incremented
 *   numeral each time this is called.
 * - open tag for the given tag type (eg. <a%1>)
 * - close tag for the given tag type (eg. </a%1>)
 * - self-closing tag for the given tag type (eg. <a%1/>)
 *
 * @param {string} type
 * @return { string[] } A tuple-like construct. See description for returned values.
 */
const getTags = ( type ) => {
	const searchString = type + '%' + getTokenCount( type );
	return [
		searchString,
		...getTagsFromSearchString( searchString ),
	];
};

/**
 * The same as `getTags` except it receives the search string for generating the
 * tags and thus does only returns the tags.
 *
 * @example
 *
 * If you provide `something` as the search string, this will return:
 *
 * ```js
 * const tags = getTagsFromSearchString( 'something' );
 * const tagsAre = tags === [
 *     '<something>',
 *     '</something>',
 *     '<something/>',
 * ];
 * ```
 *
 * @param {string} searchString  Something like `<a%1>`.
 *
 * @return {string[]} The generated tags for the search string.
 */
const getTagsFromSearchString = ( searchString ) => {
	return [
		`<${ searchString }>`,
		`</${ searchString }>`,
		`<${ searchString }/>`,
	];
};

export {
	getFormatToken,
	getTags,
	getTagsFromSearchString,
};
