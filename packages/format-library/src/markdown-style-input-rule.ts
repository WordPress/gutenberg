import { applyFormat, remove } from '@wordpress/rich-text';
import type { RichTextValue } from '@wordpress/rich-text';

type Delimiter = '*' | '_' | '**' | '__';

const unicodePunctuationOrSymbol = /[\p{P}\p{S}]/u;

function isWhitespace( character: string | undefined ): boolean {
	return character === undefined || /\s/u.test( character );
}

function isPunctuation( character: string | undefined ): boolean {
	return (
		character !== undefined && unicodePunctuationOrSymbol.test( character )
	);
}

function isEscaped( text: string, index: number ): boolean {
	let backslashCount = 0;

	for ( let offset = index - 1; text[ offset ] === '\\'; offset-- ) {
		backslashCount++;
	}

	return backslashCount % 2 === 1;
}

function isExactDelimiterRun(
	text: string,
	start: number,
	delimiter: Delimiter
): boolean {
	const marker = delimiter[ 0 ];
	const end = start + delimiter.length;

	return (
		text.slice( start, end ) === delimiter &&
		text[ start - 1 ] !== marker &&
		text[ end ] !== marker
	);
}

function isLeftFlanking( text: string, start: number, end: number ): boolean {
	const characterBefore = text[ start - 1 ];
	const characterAfter = text[ end ];

	return (
		! isWhitespace( characterAfter ) &&
		( ! isPunctuation( characterAfter ) ||
			isWhitespace( characterBefore ) ||
			isPunctuation( characterBefore ) )
	);
}

function isRightFlanking( text: string, start: number, end: number ): boolean {
	const characterBefore = text[ start - 1 ];
	const characterAfter = text[ end ];

	return (
		! isWhitespace( characterBefore ) &&
		( ! isPunctuation( characterBefore ) ||
			isWhitespace( characterAfter ) ||
			isPunctuation( characterAfter ) )
	);
}

function canOpenDelimiter(
	text: string,
	start: number,
	delimiter: Delimiter
): boolean {
	const end = start + delimiter.length;
	const leftFlanking = isLeftFlanking( text, start, end );

	if ( delimiter[ 0 ] === '*' ) {
		return leftFlanking;
	}

	return (
		leftFlanking &&
		( ! isRightFlanking( text, start, end ) ||
			isPunctuation( text[ start - 1 ] ) )
	);
}

function canCloseDelimiter(
	text: string,
	start: number,
	delimiter: Delimiter
): boolean {
	const end = start + delimiter.length;
	const rightFlanking = isRightFlanking( text, start, end );

	if ( delimiter[ 0 ] === '*' ) {
		return rightFlanking;
	}

	return (
		rightFlanking &&
		( ! isLeftFlanking( text, start, end ) || isPunctuation( text[ end ] ) )
	);
}

function applyDelimiter(
	value: RichTextValue,
	formatType: string,
	delimiter: Delimiter
): RichTextValue {
	const { start, text } = value;
	const delimiterLength = delimiter.length;
	const closingStart = start - delimiterLength;

	if (
		closingStart < delimiterLength ||
		! isExactDelimiterRun( text, closingStart, delimiter ) ||
		isEscaped( text, closingStart ) ||
		! canCloseDelimiter( text, closingStart, delimiter )
	) {
		return value;
	}

	let openingStart = text.lastIndexOf(
		delimiter,
		closingStart - delimiterLength
	);

	while ( openingStart !== -1 ) {
		if (
			isExactDelimiterRun( text, openingStart, delimiter ) &&
			! isEscaped( text, openingStart ) &&
			canOpenDelimiter( text, openingStart, delimiter )
		) {
			break;
		}

		openingStart =
			openingStart === 0
				? -1
				: text.lastIndexOf( delimiter, openingStart - 1 );
	}

	if ( openingStart === -1 ) {
		return value;
	}

	const contentStart = openingStart + delimiterLength;
	if ( contentStart === closingStart ) {
		return value;
	}

	const contentEndAfterRemoval = closingStart - delimiterLength;

	value = remove( value, openingStart, contentStart );
	value = remove(
		value,
		contentEndAfterRemoval,
		contentEndAfterRemoval + delimiterLength
	);

	return applyFormat(
		value,
		{ type: formatType },
		openingStart,
		contentEndAfterRemoval
	);
}

export function applyMarkdownStyleFormat(
	value: RichTextValue,
	formatType: string,
	delimiters: readonly Delimiter[]
): RichTextValue {
	for ( const delimiter of delimiters ) {
		const transformed = applyDelimiter( value, formatType, delimiter );

		if ( transformed !== value ) {
			return transformed;
		}
	}

	return value;
}
