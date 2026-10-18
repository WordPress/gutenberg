import type { CSSProperties } from 'react';

export function getFontSize(
	size: CSSProperties[ 'fontSize' ] = 'body'
): string {
	switch ( size ) {
		case 'body':
			return 'var(--wpds-typography-font-size-md)';
		case 'footnote':
			return 'var(--wpds-typography-font-size-xs)';
		case 'subheadline':
			return 'var(--wpds-typography-font-size-sm)';
		case 'title':
			return 'var(--wpds-typography-font-size-xl)';
		case 'caption':
		case 'largeTitle':
			return `var(--_wp-components-text-font-size-${ size })`;
	}

	if ( typeof size !== 'number' ) {
		const parsed = parseFloat( size );
		if ( Number.isNaN( parsed ) ) {
			return size;
		}
		size = parsed;
	}

	return `${ size }px`;
}

export function getHeadingFontSize( size: number | string = 3 ): string {
	if ( String( size ) === '5' ) {
		return 'var(--wpds-typography-font-size-md)';
	}

	return /^[1-6]$/.test( String( size ) )
		? `var(--_wp-components-text-font-size-heading-${ size })`
		: getFontSize( size );
}
