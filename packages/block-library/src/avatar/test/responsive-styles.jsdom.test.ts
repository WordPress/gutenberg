import { describe, expect, it } from 'vitest';
import {
	getActiveAvatarSize,
	getResetAvatarSizeAttributes,
	getUpdatedAvatarSizeAttributes,
	hasViewportAvatarSize,
	isViewportStyleState,
} from '../responsive-styles';

describe( 'Avatar responsive styles', () => {
	describe( 'isViewportStyleState', () => {
		it( 'returns false when selectedState is undefined', () => {
			expect( isViewportStyleState() ).toBe( false );
		} );

		it( 'returns false when viewport is default', () => {
			expect(
				isViewportStyleState( {
					viewport: 'default',
					pseudo: 'default',
				} )
			).toBe( false );
		} );

		it( 'returns true when a viewport state is set', () => {
			expect(
				isViewportStyleState( {
					viewport: '@mobile',
					pseudo: 'default',
				} )
			).toBe( true );
		} );
	} );

	describe( 'getActiveAvatarSize', () => {
		it( 'returns default 96 when no attributes or styles are defined', () => {
			expect( getActiveAvatarSize( {} ) ).toBe( 96 );
		} );

		it( 'returns the size attribute in default state', () => {
			expect(
				getActiveAvatarSize( {
					attributes: { size: 120 },
					selectedState: { viewport: 'default' },
				} )
			).toBe( 120 );
		} );

		it( 'returns the viewport dimension size when active', () => {
			expect(
				getActiveAvatarSize( {
					attributes: {
						size: 96,
						style: {
							'@mobile': {
								dimensions: {
									width: '48px',
									height: '48px',
								},
							},
						},
					},
					selectedState: { viewport: '@mobile' },
				} )
			).toBe( 48 );
		} );

		it( 'falls back to size attribute when viewport dimensions are unset', () => {
			expect(
				getActiveAvatarSize( {
					attributes: {
						size: 150,
						style: {
							'@mobile': {
								color: { text: '#ff0000' },
							},
						},
					},
					selectedState: { viewport: '@mobile' },
				} )
			).toBe( 150 );
		} );
	} );

	describe( 'hasViewportAvatarSize', () => {
		it( 'returns false in default state', () => {
			expect(
				hasViewportAvatarSize( {
					attributes: { size: 96 },
					selectedState: { viewport: 'default' },
				} )
			).toBe( false );
		} );

		it( 'returns false when viewport has no dimension styles', () => {
			expect(
				hasViewportAvatarSize( {
					attributes: {
						size: 96,
						style: {
							'@mobile': {
								color: { text: '#ff0000' },
							},
						},
					},
					selectedState: { viewport: '@mobile' },
				} )
			).toBe( false );
		} );

		it( 'returns true when viewport has dimension width', () => {
			expect(
				hasViewportAvatarSize( {
					attributes: {
						size: 96,
						style: {
							'@mobile': {
								dimensions: {
									width: '64px',
								},
							},
						},
					},
					selectedState: { viewport: '@mobile' },
				} )
			).toBe( true );
		} );
	} );

	describe( 'getUpdatedAvatarSizeAttributes', () => {
		it( 'updates the size attribute in default state', () => {
			expect(
				getUpdatedAvatarSizeAttributes( {
					attributes: { size: 96 },
					selectedState: { viewport: 'default' },
					newSize: 128,
				} )
			).toEqual( {
				size: 128,
			} );
		} );

		it( 'sets dimensions under style[viewport] when viewport is active', () => {
			const result = getUpdatedAvatarSizeAttributes( {
				attributes: {
					size: 96,
					style: {
						spacing: { padding: '10px' },
					},
				},
				selectedState: { viewport: '@mobile' },
				newSize: 48,
			} );

			expect( result ).toEqual( {
				style: {
					spacing: { padding: '10px' },
					'@mobile': {
						dimensions: {
							width: '48px',
							height: '48px',
						},
					},
				},
			} );
		} );

		it( 'preserves existing viewport styles when updating dimensions', () => {
			const result = getUpdatedAvatarSizeAttributes( {
				attributes: {
					size: 96,
					style: {
						'@mobile': {
							border: { radius: '50%' },
						},
					},
				},
				selectedState: { viewport: '@mobile' },
				newSize: 64,
			} );

			expect( result ).toEqual( {
				style: {
					'@mobile': {
						border: { radius: '50%' },
						dimensions: {
							width: '64px',
							height: '64px',
						},
					},
				},
			} );
		} );
	} );

	describe( 'getResetAvatarSizeAttributes', () => {
		it( 'resets size to 96 in default state', () => {
			expect(
				getResetAvatarSizeAttributes( {
					attributes: { size: 128 },
					selectedState: { viewport: 'default' },
				} )
			).toEqual( {
				size: 96,
			} );
		} );

		it( 'cleans viewport dimensions and prunes empty objects in viewport state', () => {
			const result = getResetAvatarSizeAttributes( {
				attributes: {
					size: 96,
					style: {
						'@mobile': {
							dimensions: {
								width: '48px',
								height: '48px',
							},
						},
					},
				},
				selectedState: { viewport: '@mobile' },
			} );

			expect( result ).toEqual( {
				style: undefined,
			} );
		} );

		it( 'preserves other viewport properties when dimensions are reset', () => {
			const result = getResetAvatarSizeAttributes( {
				attributes: {
					size: 96,
					style: {
						'@mobile': {
							border: { radius: '20px' },
							dimensions: {
								width: '48px',
								height: '48px',
							},
						},
					},
				},
				selectedState: { viewport: '@mobile' },
			} );

			expect( result ).toEqual( {
				style: {
					'@mobile': {
						border: { radius: '20px' },
					},
				},
			} );
		} );
	} );
} );
