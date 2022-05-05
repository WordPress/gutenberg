/**
 * Internal dependencies
 */
import { getNameForPosition } from '../';

describe( 'getNameForPosition', () => {
	test( 'should return 1 by default', () => {
		const slugPrefix = 'test-';
		const elements = [];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 1'
		);
	} );

	test( 'should return a new color name with an incremented slug id', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 2'
		);
	} );

	test( 'should return a new color name with an incremented slug id one higher than the current highest', () => {
		const slugPrefix = 'test-';
		const elements = [
			{
				slug: 'test-color-1',
			},
			{
				slug: 'test-color-2',
			},
			{
				slug: 'test-color-15',
			},
		];

		expect( getNameForPosition( elements, slugPrefix ) ).toEqual(
			'Color 16'
		);
	} );
} );
