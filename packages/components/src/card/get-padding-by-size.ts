/**
 * External dependencies
 */
import { css, type SerializedStyles } from '@emotion/react';

/**
 * Internal dependencies
 */
import type { Props, SizeToken } from './types';
import { cardPaddings } from './styles';
import { space } from '../utils/space';

const getSinglePaddingValue = ( size?: SizeToken ): string | undefined => {
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
			return '0';
	}
};

export const getPaddingBySize = ( size: Props[ 'size' ] ): SerializedStyles => {
	// Handle string-based sizes (both standard and deprecated)
	if ( typeof size === 'string' ) {
		return cardPaddings[ size as SizeToken ];
	}

	// Handle object-based sizes
	if ( size && typeof size === 'object' ) {
		return css`
			padding: ${ getSinglePaddingValue( size.top ) }
				${ getSinglePaddingValue( size.right ) }
				${ getSinglePaddingValue( size.bottom ) }
				${ getSinglePaddingValue( size.left ) };
		`;
	}

	// Default to medium if no size is provided
	return cardPaddings.medium;
};
