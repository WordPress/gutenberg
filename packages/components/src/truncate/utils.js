/**
 * External dependencies
 */
import { isNil } from 'lodash';

export const TRUNCATE_ELLIPSIS = '…';
export const TRUNCATE_TYPE = {
	auto: 'auto',
	head: 'head',
	middle: 'middle',
	tail: 'tail',
	none: 'none',
};

export const TRUNCATE_DEFAULT_PROPS = {
	ellipsis: TRUNCATE_ELLIPSIS,
	ellipsizeMode: TRUNCATE_TYPE.auto,
	limit: 0,
	numberOfLines: 0,
};

// Source
// https://github.com/kahwee/truncate-middle
/**
 * @param {string} word
 * @param {number} headLength
 * @param {number} tailLength
 * @param {string} ellipsis
 */
export function truncateMiddle( word, headLength, tailLength, ellipsis ) {
	if ( typeof word !== 'string' ) {
		return '';
	}
	const wordLength = word.length;
	// Setting default values
	// eslint-disable-next-line no-bitwise
	const frontLength = ~~headLength; // Will cast to integer
	// eslint-disable-next-line no-bitwise
	const backLength = ~~tailLength;
	/* Istanbul ignore next. */
	const truncateStr = ! isNil( ellipsis ) ? ellipsis : TRUNCATE_ELLIPSIS;

	if (
		( frontLength === 0 && backLength === 0 ) ||
		frontLength >= wordLength ||
		backLength >= wordLength ||
		frontLength + backLength >= wordLength
	) {
		return word;
	} else if ( backLength === 0 ) {
		return word.slice( 0, frontLength ) + truncateStr;
	}
	return (
		word.slice( 0, frontLength ) +
		truncateStr +
		word.slice( wordLength - backLength )
	);
}

/**
 *
 * @param {string}                        words
 * @param {typeof TRUNCATE_DEFAULT_PROPS} props
 */
export function truncateContent( words = '', props ) {
	const mergedProps = { ...TRUNCATE_DEFAULT_PROPS, ...props };
	const { ellipsis, ellipsizeMode, limit } = mergedProps;

	if ( ellipsizeMode === TRUNCATE_TYPE.none ) {
		return words;
	}

	let truncateHead;
	let truncateTail;

	switch ( ellipsizeMode ) {
		case TRUNCATE_TYPE.head:
			truncateHead = 0;
			truncateTail = limit;
			break;
		case TRUNCATE_TYPE.middle:
			truncateHead = Math.floor( limit / 2 );
			truncateTail = Math.floor( limit / 2 );
			break;
		default:
			truncateHead = limit;
			truncateTail = 0;
	}

	const truncatedContent =
		ellipsizeMode !== TRUNCATE_TYPE.auto
			? truncateMiddle( words, truncateHead, truncateTail, ellipsis )
			: words;

	return truncatedContent;
}
