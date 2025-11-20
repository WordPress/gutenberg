/**
 * Size token for padding.
 * Aligned with the Card component's spacing scale (4px base grid).
 */
export type PaddingSize =
	| 'x-small'
	| 'small'
	| 'medium'
	| 'large'
	| 'extra-large'
	| 'none';

/**
 * Dimension variant that allows directional specification using logical CSS properties.
 * Supports both block (vertical) and inline (horizontal) directions, with optional start/end variants.
 */
export type DimensionVariant< T > = {
	block?: T;
	blockStart?: T;
	blockEnd?: T;
	inline?: T;
	inlineStart?: T;
	inlineEnd?: T;
};

/**
 * Padding options for DataViewsPicker.
 * Can be either a single padding size token or an object with directional variants.
 */
export type PaddingOptions = PaddingSize | DimensionVariant< PaddingSize >;
