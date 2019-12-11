/**
 * Internal dependencies
 */
import {
	serializeGradientColor,
	serializeGradientPosition,
	serializeGradientColorStop,
	serializeGradientOrientation,
	serializeGradient,
} from '../serializer';

describe( 'It should serialize a gradient', () => {
	test( 'serializeGradientColor', () => {
		expect( serializeGradientColor(
			{ type: 'rgba', value: [ 1, 2, 3, 0.5 ] }
		) ).toBe( 'rgba(1,2,3,0.5)' );

		expect( serializeGradientColor(
			{ type: 'rgb', value: [ 255, 0, 0 ] }
		) ).toBe( 'rgb(255,0,0)' );
	} );

	test( 'serializeGradientPosition', () => {
		expect( serializeGradientPosition(
			{ type: '%', value: 70 }
		) ).toBe( '70%' );

		expect( serializeGradientPosition(
			{ type: '%', value: 0 }
		) ).toBe( '0%' );

		expect( serializeGradientPosition(
			{ type: 'px', value: 4 }
		) ).toBe( '4px' );
	} );

	test( 'serializeGradientColorStop', () => {
		expect( serializeGradientColorStop(
			{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: '%', value: 70 } }
		) ).toBe( 'rgba(1,2,3,0.5) 70%' );

		expect( serializeGradientColorStop(
			{ type: 'rgb', value: [ 255, 0, 0 ], length: { type: '%', value: 0 } }
		) ).toBe( 'rgb(255,0,0) 0%' );

		expect( serializeGradientColorStop(
			{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: 'px', value: 100 } }
		) ).toBe( 'rgba(1,2,3,0.5) 100px' );
	} );

	test( 'serializeGradientOrientation', () => {
		expect( serializeGradientOrientation(
			{ type: 'angular', value: 40 }
		) ).toBe( '40deg' );

		expect( serializeGradientOrientation(
			{ type: 'angular', value: 0 }
		) ).toBe( '0deg' );
	} );

	test( 'serializeGradient', () => {
		expect( serializeGradient(
			{
				type: 'linear-gradient',
				orientation: { type: 'angular', value: 40 },
				colorStops: [
					{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: '%', value: 70 } },
					{ type: 'rgba', value: [ 255, 1, 1, 0.9 ], length: { type: '%', value: 40 } },
				],
			}
		) ).toBe( 'linear-gradient(40deg,rgba(255,1,1,0.9) 40%,rgba(1,2,3,0.5) 70%)' );

		expect( serializeGradient(
			{
				type: 'linear-gradient',
				colorStops: [
					{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: '%', value: 70 } },
					{ type: 'rgba', value: [ 255, 1, 1, 0.9 ], length: { type: '%', value: 40 } },
				],
			}
		) ).toBe( 'linear-gradient(rgba(255,1,1,0.9) 40%,rgba(1,2,3,0.5) 70%)' );

		expect( serializeGradient(
			{
				type: 'linear-gradient',
				orientation: { type: 'angular', value: 0 },
				colorStops: [
					{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: '%', value: 0 } },
					{ type: 'rgba', value: [ 255, 1, 1, 0.9 ], length: { type: '%', value: 40 } },
					{ type: 'rgba', value: [ 1, 2, 3, 0.5 ], length: { type: '%', value: 100 } },
					{ type: 'rgba', value: [ 10, 20, 30, 0.5 ], length: { type: '%', value: 20 } },
				],
			}
		) ).toBe( 'linear-gradient(0deg,rgba(1,2,3,0.5) 0%,rgba(10,20,30,0.5) 20%,rgba(255,1,1,0.9) 40%,rgba(1,2,3,0.5) 100%)' );
	} );
} );
