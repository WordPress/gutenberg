/**
 * @typedef {-8 | -7 | -6 | -5 | -4 | -3 | -2 | -1 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8} SpacingScale
 */

/**
 * @type {Record<SpacingScale, string>}
 */
const spacings = {
	0: '0',
	1: '4px',
	2: '8px',
	3: '4px',
	4: '8px',
	5: '24px',
	6: '32px',
	7: '40px',
	8: '48px',
};

/**
 * @param {string[]} properties
 * @return {(value: SpacingScale) => string}
 */
const createMixin = ( properties ) => {
	return ( value ) =>
		properties.reduce(
			( styles, property ) => ( {
				...styles,
				[ property ]:
					value < 0
						? `-${ spacings[ Math.abs( value ) ] }`
						: spacings[ value ],
			} ),
			{}
		);
};

export const margin = createMixin( [ 'margin' ] );
export const marginX = createMixin( [ 'marginLeft', 'marginRight' ] );
export const marginY = createMixin( [ 'marginTop', 'marginBottom' ] );
export const marginTop = createMixin( [ 'marginTop' ] );
export const marginRight = createMixin( [ 'marginRight' ] );
export const marginBottom = createMixin( [ 'marginBottom' ] );
export const marginLeft = createMixin( [ 'marginLeft' ] );

export const padding = createMixin( [ 'padding' ] );
export const paddingX = createMixin( [ 'paddingLeft', 'paddingRight' ] );
export const paddingY = createMixin( [ 'paddingTop', 'paddingBottom' ] );
export const paddingTop = createMixin( [ 'paddingTop' ] );
export const paddingRight = createMixin( [ 'paddingRight' ] );
export const paddingBottom = createMixin( [ 'paddingBottom' ] );
export const paddingLeft = createMixin( [ 'paddingLeft' ] );
