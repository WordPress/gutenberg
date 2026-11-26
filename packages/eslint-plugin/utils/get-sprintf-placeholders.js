/**
 * Regular expression matching an escaped percent sign or a sprintf placeholder.
 *
 * The placeholder part mirrors `REGEXP_SPRINTF_PLACEHOLDER`, without its
 * lookbehind: the escaped percent sign alternative consumes `%%` first, so
 * `%%s` is an escaped percent sign followed by a literal `s`, and `%%%s` is an
 * escaped percent sign followed by a placeholder.
 *
 * @type {RegExp}
 */
const REGEXP_PERCENT_OR_PLACEHOLDER =
	/%%|%(?:(\d+)\$|\(([$_a-zA-Z][$_a-zA-Z0-9]*)\))?[ +0#-]*\d*(\.(?:\d+|\*))?(?:ll|[lhqL])?([cduxXefgsp])/g;

/**
 * @typedef {Object} SprintfPlaceholder
 *
 * @property {string}  raw              The placeholder as written, such as `%1$s`.
 * @property {number}  start            Offset of the placeholder in the string.
 * @property {number}  end              Offset after the placeholder in the string.
 * @property {?number} position         Explicit argument position, such as 1 for `%1$s`.
 * @property {?string} name             Argument name, such as `count` for `%(count)d`.
 * @property {string}  type             Conversion type, such as `s` or `d`.
 * @property {boolean} isOrdered        Whether the placeholder has a position or a name.
 * @property {boolean} hasStarPrecision Whether the precision is read from an argument, as in `%.*f`.
 */

/**
 * Returns the sprintf placeholders in a string, skipping escaped percent signs.
 *
 * @param {string} string String to search.
 *
 * @return {SprintfPlaceholder[]} Placeholders, in the order they appear.
 */
function getSprintfPlaceholders( string ) {
	const placeholders = [];

	for ( const match of string.matchAll( REGEXP_PERCENT_OR_PLACEHOLDER ) ) {
		if ( match[ 0 ] === '%%' ) {
			continue;
		}

		const [ raw, position, name, precision, type ] = match;

		placeholders.push( {
			raw,
			start: match.index,
			end: match.index + raw.length,
			position: position === undefined ? null : Number( position ),
			name: name ?? null,
			type,
			isOrdered: position !== undefined || name !== undefined,
			hasStarPrecision: precision === '.*',
		} );
	}

	return placeholders;
}

/**
 * Resolves which argument each placeholder reads, following `@tannin/sprintf`,
 * the implementation behind `sprintf` in `@wordpress/i18n`: every placeholder
 * that is not named advances an argument counter, and a placeholder without a
 * position reads the argument after the counter. A `*` precision reads the
 * argument at the counter and advances it too.
 *
 * @param {SprintfPlaceholder[]} placeholders Placeholders, in the order they appear.
 *
 * @return {{ positions: Array<?number>, requiredArgumentCount: ?number }} The
 * 1-based argument position read by each placeholder, `null` for a named
 * placeholder, and the number of arguments the placeholders read, `null` if
 * any placeholder is named.
 */
function getSprintfArgumentPositions( placeholders ) {
	let counter = 0;
	let requiredArgumentCount = 0;
	let hasNamed = false;

	const positions = placeholders.map( ( placeholder ) => {
		if ( placeholder.hasStarPrecision ) {
			counter++;
			requiredArgumentCount = Math.max( requiredArgumentCount, counter );
		}

		if ( placeholder.name !== null ) {
			hasNamed = true;
			return null;
		}

		const position = placeholder.position ?? counter + 1;
		counter++;
		requiredArgumentCount = Math.max( requiredArgumentCount, position );
		return position;
	} );

	return {
		positions,
		requiredArgumentCount: hasNamed ? null : requiredArgumentCount,
	};
}

module.exports = {
	getSprintfPlaceholders,
	getSprintfArgumentPositions,
};
