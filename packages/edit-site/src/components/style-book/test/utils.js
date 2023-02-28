/**
 * Internal dependencies
 */
import { getMarginBoxValuesFromShadowValue } from '../utils';

describe( 'getMarginBoxValuesFromShadowValue()', () => {
	describe( 'should parse CSS box-shadow value and return matching margin offset values', () => {
		const testData = [
			[
				'6px 6px 9px rgba(0, 0, 0, 0.2)',
				{
					top: '3px', // bottom offset of 6px minus 9px blur radius = give 3px breathing room.
					right: '15px', // right offset of 6px plus 9px blur radius = give 15px breathing room.
					bottom: '15px',
					left: '3px',
				},
			],
			[
				'12px 12px 50px rgba(0, 0, 0, 0.4)',
				{
					top: '38px', // bottom offset of 12px minus 50px blur radius = give 38px breathing room.
					right: '62px', // right offset of 12px plus 50px blur radius = give 62px breathing room.
					bottom: '62px',
					left: '38px',
				},
			],
			[
				'6px 6px 0px rgba(0, 0, 0, 0.2)',
				{
					top: '0px', // bottom offset of 6px minus 0px blur radius = give 0px breathing room.
					right: '6px', // right offset of 6px plus 0px blur radius = give 6px breathing room.
					bottom: '6px',
					left: '0px',
				},
			],
			[
				'6px 6px 0px -3px rgba(255, 255, 255, 1), 6px 6px rgba(0, 0, 0, 1)',
				{
					top: '0px',
					right: '6px',
					bottom: '6px',
					left: '0px',
				},
			],
			[
				'1em 2rem 16px rgba(0, 0, 0, 1)',
				{
					top: '0px',
					right: '32px',
					bottom: '48px',
					left: '0px',
				},
			],
			[
				'1em 2rem 16px rgba(0, 0, 0, 1)',
				{
					top: '0px',
					right: '32px',
					bottom: '48px',
					left: '0px',
				},
			],
			[
				'-8px -8px 16px #fff',
				{
					top: '24px',
					right: '8px',
					bottom: '8px',
					left: '24px',
				},
			],
		];

		test.each( testData )(
			'getMarginBoxValuesFromShadowValue( %s )',
			( cssShadowValue, expected ) => {
				expect(
					getMarginBoxValuesFromShadowValue( cssShadowValue )
				).toEqual( expected );
			}
		);
	} );
} );
