/**
 * Internal dependencies
 */
import { isSimpleCssValue, getToggleGroupOptions } from '../utils';

const simpleCSSCases: [ number | string, boolean ][] = [
	// Test integers and non-integers.
	[ 1, true ],
	[ 1.25, true ],
	[ '123', true ],
	[ '1.5', true ],
	[ '0.75', true ],
	// CSS unit tests.
	[ '20px', true ],
	[ '0.8em', true ],
	[ '2rem', true ],
	[ '1.4vw', true ],
	[ '0.4vh', true ],
	// Invalid negative values,
	[ '-5px', false ],
	// Complex CSS values that should fail.
	[ 'abs(-10px)', false ],
	[ 'calc(10px + 1)', false ],
	[ 'clamp(2.5rem, 4vw, 3rem)', false ],
	[ 'max(4.5em, 3vh)', false ],
	[ 'min(10px, 1rem)', false ],
	[ 'minmax(30px, auto)', false ],
	[ 'var(--wp--font-size)', false ],
];

describe( 'isSimpleCssValue', () => {
	test.each( simpleCSSCases )(
		'given %p as argument, returns %p',
		( cssValue, result ) => {
			expect( isSimpleCssValue( cssValue ) ).toBe( result );
		}
	);
} );

describe( 'getToggleGroupOptions', () => {
	test( 'should assign t-shirt sizes by default up until the aliases length', () => {
		const optionsArray = [
			{
				slug: '1',
				size: '1',
				name: '1',
			},
			{
				slug: '2',
				size: '2',
				name: '2',
			},
			{
				slug: '3',
				size: '3',
				name: '3',
			},
			{
				slug: '4',
				size: '4',
				name: '4',
			},
			{
				slug: '5',
				size: '5',
			},
		];
		expect(
			getToggleGroupOptions( optionsArray, [
				'S',
				'M',
				'L',
				'XL',
				'XXL',
			] )
		).toEqual( [
			{
				key: '1',
				label: 'S',
				name: '1',
				value: '1',
			},
			{
				key: '2',
				label: 'M',
				name: '2',
				value: '2',
			},
			{
				key: '3',
				label: 'L',
				name: '3',
				value: '3',
			},
			{
				key: '4',
				label: 'XL',
				name: '4',
				value: '4',
			},
			{
				key: '5',
				label: 'XXL',
				name: 'XXL',
				value: '5',
			},
		] );
	} );
} );
