/**
 * External dependencies
 */
import type { CSSProperties } from 'react';

/**
 * Internal dependencies
 */
import type {
	Border,
	AnyBorder,
	Borders,
	BorderProp,
	BorderSide,
} from './types';

const sides: BorderSide[] = [ 'top', 'right', 'bottom', 'left' ];
const borderProps: BorderProp[] = [ 'color', 'style', 'width' ];

const isEmptyBorder = ( border?: Border ) => {
	if ( ! border ) {
		return true;
	}
	return ! borderProps.some( ( prop ) => border[ prop ] !== undefined );
};

export const isDefinedBorder = ( border: AnyBorder ) => {
	// No border, no worries :)
	if ( ! border ) {
		return false;
	}

	// If we have individual borders per side within the border object we
	// need to check whether any of those side borders have been set.
	if ( hasSplitBorders( border ) ) {
		const allSidesEmpty = sides.every( ( side ) =>
			isEmptyBorder( ( border as Borders )[ side ] )
		);

		return ! allSidesEmpty;
	}

	// If we have a top-level border only, check if that is empty. e.g.
	// { color: undefined, style: undefined, width: undefined }
	// Border radius can still be set within the border object as it is
	// handled separately.
	return ! isEmptyBorder( border as Border );
};

export const hasSplitBorders = ( border: AnyBorder = {} ) => {
	return Object.keys( border ).some(
		( side ) => sides.indexOf( side as BorderSide ) !== -1
	);
};
