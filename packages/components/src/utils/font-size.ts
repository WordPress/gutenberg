import type { CSSProperties } from 'react';

const PRESET_FONT_SIZES = [
	'body',
	'caption',
	'footnote',
	'largeTitle',
	'subheadline',
	'title',
];

export function getFontSize(
	size: CSSProperties[ 'fontSize' ] = 'body'
): string {
	if ( typeof size !== 'number' ) {
		if ( PRESET_FONT_SIZES.includes( size ) ) {
			return `var(--_wp-components-text-font-size-${ size })`;
		}

		const parsed = parseFloat( size );
		if ( Number.isNaN( parsed ) ) {
			return size;
		}
		size = parsed;
	}

	return `${ size }px`;
}

export function getHeadingFontSize( size: number | string = 3 ): string {
	return /^[1-6]$/.test( String( size ) )
		? `var(--_wp-components-text-font-size-heading-${ size })`
		: getFontSize( size );
}
