/**
 * Internal dependencies
 */
import { space } from '../utils/space';
import type { SpaceInput } from '../utils/space';
import type { SizeOptions } from './types';
import CONFIG from '../utils/config-values';

// Map of size presets to their individual padding values
const SIZE_PADDING_MAP: Record<
	SizeOptions | 'extraSmall',
	{
		top: string;
		right: string;
		bottom: string;
		left: string;
	}
> = {
	xSmall: {
		top: space( 2 ) as string,
		right: space( 2 ) as string,
		bottom: space( 2 ) as string,
		left: space( 2 ) as string,
	},
	extraSmall: {
		top: space( 2 ) as string,
		right: space( 2 ) as string,
		bottom: space( 2 ) as string,
		left: space( 2 ) as string,
	},
	small: {
		top: space( 4 ) as string,
		right: space( 4 ) as string,
		bottom: space( 4 ) as string,
		left: space( 4 ) as string,
	},
	medium: {
		top: space( 4 ) as string,
		right: space( 6 ) as string,
		bottom: space( 4 ) as string,
		left: space( 6 ) as string,
	},
	large: {
		top: space( 6 ) as string,
		right: space( 8 ) as string,
		bottom: space( 6 ) as string,
		left: space( 8 ) as string,
	},
};

export interface ComputePaddingStyleProps {
	size?: SizeOptions | 'extraSmall';
	paddingTop?: SpaceInput;
	paddingRight?: SpaceInput;
	paddingBottom?: SpaceInput;
	paddingLeft?: SpaceInput;
}

/**
 * Computes the CSS padding style based on size preset and/or individual padding overrides.
 *
 * @param props - The padding configuration props
 * @return A CSS padding string or an object with individual padding properties
 */
export function computePaddingStyle( props: ComputePaddingStyleProps ): {
	padding?: string;
	paddingTop?: string;
	paddingRight?: string;
	paddingBottom?: string;
	paddingLeft?: string;
} {
	const {
		size = 'medium',
		paddingTop,
		paddingRight,
		paddingBottom,
		paddingLeft,
	} = props;

	// If no individual padding props are provided, use the size preset
	if (
		paddingTop === undefined &&
		paddingRight === undefined &&
		paddingBottom === undefined &&
		paddingLeft === undefined
	) {
		// Return the original shorthand padding for backward compatibility
		const paddingMap: Record< string, string > = {
			xSmall: CONFIG.cardPaddingXSmall,
			extraSmall: CONFIG.cardPaddingXSmall,
			small: CONFIG.cardPaddingSmall,
			medium: CONFIG.cardPaddingMedium,
			large: CONFIG.cardPaddingLarge,
		};

		return { padding: paddingMap[ size ] };
	}

	// Get base padding values from size preset
	const basePadding = SIZE_PADDING_MAP[ size ];

	// Override with individual padding props if provided
	const computedPaddingTop =
		paddingTop !== undefined ? space( paddingTop ) : basePadding.top;
	const computedPaddingRight =
		paddingRight !== undefined ? space( paddingRight ) : basePadding.right;
	const computedPaddingBottom =
		paddingBottom !== undefined
			? space( paddingBottom )
			: basePadding.bottom;
	const computedPaddingLeft =
		paddingLeft !== undefined ? space( paddingLeft ) : basePadding.left;

	return {
		paddingTop: computedPaddingTop,
		paddingRight: computedPaddingRight,
		paddingBottom: computedPaddingBottom,
		paddingLeft: computedPaddingLeft,
	};
}
