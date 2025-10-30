/**
 * External dependencies
 */
import { css, type SerializedStyles } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { Props, SizeToken } from './types';
import { space } from '../utils/space';

const CONFIG = {
	cardPaddingXSmall: `${ space( 2 ) }`,
	cardPaddingSmall: `${ space( 4 ) }`,
	cardPaddingMedium: `${ space( 4 ) } ${ space( 6 ) }`,
	cardPaddingLarge: `${ space( 6 ) } ${ space( 8 ) }`,
};

const xSmallCardPadding = css`
	padding: ${ CONFIG.cardPaddingXSmall };
`;

export const cardPaddings = {
	large: css`
		padding: ${ CONFIG.cardPaddingLarge };
	`,
	medium: css`
		padding: ${ CONFIG.cardPaddingMedium };
	`,
	small: css`
		padding: ${ CONFIG.cardPaddingSmall };
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
		default:
			return space( 6 );
	}
};

export const getPaddingBySize = ( size: Props[ 'size' ] ): SerializedStyles => {
	// Handle string-based sizes (both standard and deprecated)
	if ( typeof size === 'string' ) {
		return cardPaddings[ size as SizeToken ];
	}

	// Handle object-based sizes
	if ( size && typeof size === 'object' ) {
		const top = size.blockStart;
		const bottom = size.blockEnd;
		const left = size.inlineStart;
		const right = size.inlineEnd;

		return css`
			padding-block-start: ${ getSinglePaddingValue( top ) };
			padding-block-end: ${ getSinglePaddingValue( bottom ) };
			padding-inline-start: ${ getSinglePaddingValue( left ) };
			padding-inline-end: ${ getSinglePaddingValue( right ) };
		`;
	}

	// Default to medium if no size is provided
	return cardPaddings.medium;
};
