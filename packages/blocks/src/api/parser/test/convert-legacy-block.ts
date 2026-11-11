import { describe, expect, it } from 'vitest';
import { convertLegacyBlockNameAndAttributes } from '../convert-legacy-block';

describe( 'convertLegacyBlockNameAndAttributes', () => {
	describe( 'Cover minimum height', () => {
		it( 'should copy the legacy minimum height to the dimensions block support', () => {
			expect(
				convertLegacyBlockNameAndAttributes( 'core/cover', {
					minHeight: 100,
					minHeightUnit: 'vh',
				} )
			).toEqual( [
				'core/cover',
				{
					minHeight: 100,
					minHeightUnit: 'vh',
					style: { dimensions: { minHeight: '100vh' } },
				},
			] );
		} );

		it( 'should default to pixels when no unit is set', () => {
			const [ , attributes ] = convertLegacyBlockNameAndAttributes(
				'core/cover',
				{ minHeight: 300 }
			);

			expect( attributes.style ).toEqual( {
				dimensions: { minHeight: '300px' },
			} );
		} );

		it( 'should keep other styles', () => {
			const [ , attributes ] = convertLegacyBlockNameAndAttributes(
				'core/cover',
				{
					minHeight: 50,
					minHeightUnit: '%',
					style: {
						color: { text: '#000' },
						dimensions: { aspectRatio: '16/9' },
					},
				}
			);

			expect( attributes.style ).toEqual( {
				color: { text: '#000' },
				dimensions: { aspectRatio: '16/9', minHeight: '50%' },
			} );
		} );

		it( 'should not override an existing block support value', () => {
			const [ , attributes ] = convertLegacyBlockNameAndAttributes(
				'core/cover',
				{
					minHeight: 100,
					minHeightUnit: 'vh',
					style: {
						dimensions: { minHeight: 'var:preset|dimension|full' },
					},
				}
			);

			expect( attributes.style ).toEqual( {
				dimensions: { minHeight: 'var:preset|dimension|full' },
			} );
		} );

		it( 'should convert the legacy Cover Image block', () => {
			const [ name, attributes ] = convertLegacyBlockNameAndAttributes(
				'core/cover-image',
				{ minHeight: 400, minHeightUnit: 'px' }
			);

			expect( name ).toBe( 'core/cover' );
			expect( attributes.style ).toEqual( {
				dimensions: { minHeight: '400px' },
			} );
		} );

		it( 'should not change other blocks', () => {
			expect(
				convertLegacyBlockNameAndAttributes( 'core/group', {
					minHeight: 100,
					minHeightUnit: 'vh',
				} )
			).toEqual( [
				'core/group',
				{ minHeight: 100, minHeightUnit: 'vh' },
			] );
		} );
	} );
} );
