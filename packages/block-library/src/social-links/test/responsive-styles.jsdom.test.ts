import { describe, expect, it } from 'vitest';
import {
	getActiveIconSize,
	getUpdatedIconSizeAttributes,
	hasViewportIconSize,
} from '../responsive-styles';

describe( 'Social Links responsive styles', () => {
	describe( 'getActiveIconSize', () => {
		it( 'returns the size attribute when in default state', () => {
			expect(
				getActiveIconSize( {
					attributes: { size: 'has-small-icon-size' },
					isViewportStyleState: false,
				} )
			).toBe( 'has-small-icon-size' );

			expect(
				getActiveIconSize( {
					attributes: {},
					isViewportStyleState: false,
				} )
			).toBeNull();
		} );

		it.each( [
			[ '16px', 'has-small-icon-size' ],
			[ '24px', 'has-normal-icon-size' ],
			[ '36px', 'has-large-icon-size' ],
			[ '48px', 'has-huge-icon-size' ],
		] )(
			'maps fontSize %s to size class %s in viewport state',
			( fontSize, expectedClass ) => {
				expect(
					getActiveIconSize( {
						attributes: {
							style: {
								'@mobile': {
									typography: { fontSize },
								},
							},
						},
						isViewportStyleState: true,
						viewport: '@mobile',
					} )
				).toBe( expectedClass );
			}
		);

		it( 'returns null when viewport has no fontSize set', () => {
			expect(
				getActiveIconSize( {
					attributes: {
						size: 'has-large-icon-size',
						style: {
							'@mobile': {
								spacing: { padding: '10px' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
				} )
			).toBeNull();
		} );

		it( 'returns null for unrecognized fontSize values', () => {
			expect(
				getActiveIconSize( {
					attributes: {
						style: {
							'@mobile': {
								typography: { fontSize: '999px' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
				} )
			).toBeNull();
		} );
	} );

	describe( 'hasViewportIconSize', () => {
		it( 'returns false when viewport is not provided or has no fontSize', () => {
			expect(
				hasViewportIconSize( {
					attributes: { size: 'has-large-icon-size' },
				} )
			).toBe( false );

			expect(
				hasViewportIconSize( {
					attributes: {
						style: {
							'@mobile': {
								spacing: { padding: '10px' },
							},
						},
					},
					viewport: '@mobile',
				} )
			).toBe( false );
		} );

		it( 'returns true when viewport has a fontSize set', () => {
			expect(
				hasViewportIconSize( {
					attributes: {
						style: {
							'@mobile': {
								typography: { fontSize: '16px' },
							},
						},
					},
					viewport: '@mobile',
				} )
			).toBe( true );
		} );
	} );

	describe( 'getUpdatedIconSizeAttributes', () => {
		it( 'updates the size attribute in default state', () => {
			expect(
				getUpdatedIconSizeAttributes( {
					attributes: {},
					isViewportStyleState: false,
					newSize: 'has-small-icon-size',
				} )
			).toEqual( {
				size: 'has-small-icon-size',
			} );

			expect(
				getUpdatedIconSizeAttributes( {
					attributes: { size: 'has-small-icon-size' },
					isViewportStyleState: false,
					newSize: null,
				} )
			).toEqual( {
				size: undefined,
			} );

			expect(
				getUpdatedIconSizeAttributes( {
					attributes: { size: 'has-small-icon-size' },
					isViewportStyleState: false,
					newSize: '',
				} )
			).toEqual( {
				size: undefined,
			} );
		} );

		it( 'updates the viewport typography fontSize style in viewport state', () => {
			expect(
				getUpdatedIconSizeAttributes( {
					attributes: { size: 'has-large-icon-size' },
					isViewportStyleState: true,
					viewport: '@mobile',
					newSize: 'has-small-icon-size',
				} )
			).toEqual( {
				style: {
					'@mobile': {
						typography: { fontSize: '16px' },
					},
				},
			} );
		} );

		it( 'preserves other styles within the same viewport', () => {
			expect(
				getUpdatedIconSizeAttributes( {
					attributes: {
						style: {
							'@mobile': {
								spacing: { padding: '20px' },
								typography: { fontStyle: 'italic' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
					newSize: 'has-huge-icon-size',
				} )
			).toEqual( {
				style: {
					'@mobile': {
						spacing: { padding: '20px' },
						typography: {
							fontStyle: 'italic',
							fontSize: '48px',
						},
					},
				},
			} );
		} );

		it( 'preserves styles for other viewports', () => {
			expect(
				getUpdatedIconSizeAttributes( {
					attributes: {
						style: {
							'@tablet': {
								typography: { fontSize: '36px' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
					newSize: 'has-small-icon-size',
				} )
			).toEqual( {
				style: {
					'@tablet': {
						typography: { fontSize: '36px' },
					},
					'@mobile': {
						typography: { fontSize: '16px' },
					},
				},
			} );
		} );

		it( 'cleans up typography and viewport when resetting icon size in viewport state', () => {
			expect(
				getUpdatedIconSizeAttributes( {
					attributes: {
						style: {
							'@mobile': {
								typography: { fontSize: '16px' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
					newSize: null,
				} )
			).toEqual( {
				style: undefined,
			} );

			expect(
				getUpdatedIconSizeAttributes( {
					attributes: {
						style: {
							'@mobile': {
								spacing: { padding: '15px' },
								typography: { fontSize: '16px' },
							},
						},
					},
					isViewportStyleState: true,
					viewport: '@mobile',
					newSize: '',
				} )
			).toEqual( {
				style: {
					'@mobile': {
						spacing: { padding: '15px' },
					},
				},
			} );
		} );
	} );
} );
