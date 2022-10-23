/**
 * External dependencies
 */
import type { CSSProperties, ReactText } from 'react';

/**
 * Internal dependencies
 */
import CONFIG from '../../utils/config-values';

export type HeadingSize =
	| 1
	| 2
	| 3
	| 4
	| 5
	| 6
	| '1'
	| '2'
	| '3'
	| '4'
	| '5'
	| '6';

export const BASE_FONT_SIZE = 13;

export const PRESET_FONT_SIZES = {
	body: BASE_FONT_SIZE,
	caption: 10,
	footnote: 11,
	largeTitle: 28,
	subheadline: 12,
	title: 20,
};

export const HEADING_FONT_SIZES = [ 1, 2, 3, 4, 5, 6 ].flatMap( ( n ) => [
	n as HeadingSize,
	n.toString() as HeadingSize,
] );

export function getFontSize(
	size:
		| CSSProperties[ 'fontSize' ]
		| keyof typeof PRESET_FONT_SIZES = BASE_FONT_SIZE
): string {
	if ( size in PRESET_FONT_SIZES ) {
		return getFontSize(
			PRESET_FONT_SIZES[ size as keyof typeof PRESET_FONT_SIZES ]
		);
	}

	if ( typeof size !== 'number' ) {
		const parsed = parseFloat( size );
		if ( Number.isNaN( parsed ) ) return size;
		size = parsed;
	}

	const ratio = `(${ size } / ${ BASE_FONT_SIZE })`;
	return `calc(${ ratio } * ${ CONFIG.fontSize })`;
}

export function getHeadingFontSize( size: ReactText = 3 ): string {
	if ( ! HEADING_FONT_SIZES.includes( size as HeadingSize ) ) {
		return getFontSize( size );
	}

	const headingSize = `fontSizeH${ size }` as `fontSizeH${ HeadingSize }`;
	return CONFIG[ headingSize ];
}
