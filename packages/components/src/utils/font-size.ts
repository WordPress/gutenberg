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
			return '10px';
		case 'largeTitle':
			return '28px';
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
	// Preserve the legacy heading scale where no matching WPDS token exists.
	switch ( String( size ) ) {
		case '1':
			return '31.72px';
		case '2':
			return '25.35px';
		case '3':
			return '20.28px';
		case '4':
			return '16.25px';
		case '5':
			return 'var(--wpds-typography-font-size-md)';
		case '6':
			return '10.4px';
		default:
			return getFontSize( size );
	}
}
