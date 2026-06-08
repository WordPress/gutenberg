/**
 * External dependencies
 */
import { css, type SerializedStyles } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { Props, SizeToken } from './types';
import { space } from '../utils/space';

const xSmallCardPadding = css`
	padding: ${ space( 2 ) };
`;

export const cardPaddings = {
	none: css`
		padding: 0;
	`,
	large: css`
		padding: ${ space( 6 ) } ${ space( 8 ) };
	`,
	medium: css`
		padding: ${ space( 4 ) } ${ space( 6 ) };
	`,
	small: css`
		padding: ${ space( 4 ) };
	`,
	xSmall: xSmallCardPadding,
	// The `extraSmall` size is not officially documented, but the following styles
	// are kept for legacy reasons to support older values of the `size` prop.
	extraSmall: xSmallCardPadding,
};

const getSinglePaddingValue = ( size: SizeToken ): string | undefined => {
	switch ( size ) {
		case 'xSmall':
			return space( 2 );
		case 'small':
			return space( 4 );
		case 'medium':
			return space( 6 );
		case 'large':
			return space( 8 );
		case 'none':
			return '0';
		default:
			return space( 6 );
	}
};

export const getPaddingBySize = ( size: Props[ 'size' ] ): SerializedStyles => {
	// Handle string-based sizes (both standard and deprecated)
	if ( typeof size === 'string' ) {
		return cardPaddings[ size as SizeToken ];
	}

	if ( size ) {
		const { blockStart, blockEnd, inlineStart, inlineEnd } = size;
		return css`
			padding-block-start: ${ getSinglePaddingValue( blockStart ) };
			padding-block-end: ${ getSinglePaddingValue( blockEnd ) };
			padding-inline-start: ${ getSinglePaddingValue( inlineStart ) };
			padding-inline-end: ${ getSinglePaddingValue( inlineEnd ) };
		`;
	}

	// Default to medium if no size is provided
	return cardPaddings.medium;
};
