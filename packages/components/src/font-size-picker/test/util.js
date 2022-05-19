/**
 * Internal dependencies
 */
import { isSimpleCssValue, splitValueAndUnitFromSize } from '../utils';

const simpleCSSCases = [
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

const splitValuesCases = [
	// Test integers and non-integers.
	[ 1, '1', undefined ],
	[ 1.25, '1.25', undefined ],
	[ '123', '123', undefined ],
	[ '1.5', '1.5', undefined ],
	[ '0.75', '0.75', undefined ],
	// Valid simple CSS values.
	[ '20px', '20', 'px' ],
	[ '0.8em', '0.8', 'em' ],
	[ '2rem', '2', 'rem' ],
	[ '1.4vw', '1.4', 'vw' ],
	[ '0.4vh', '0.4', 'vh' ],
	// Invalid negative values,
	[ '-5px', undefined, undefined ],
	// Complex CSS values that shouldn't parse.
	[ 'abs(-15px)', undefined, undefined ],
	[ 'calc(10px + 1)', undefined, undefined ],
	[ 'clamp(2.5rem, 4vw, 3rem)', undefined, undefined ],
	[ 'max(4.5em, 3vh)', undefined, undefined ],
	[ 'min(10px, 1rem)', undefined, undefined ],
	[ 'minmax(30px, auto)', undefined, undefined ],
	[ 'var(--wp--font-size)', undefined, undefined ],
];

describe( 'splitValueAndUnitFromSize', () => {
	test.each( splitValuesCases )(
		'given %p as argument, returns value = %p and unit = %p',
		( cssValue, expectedValue, expectedUnit ) => {
			const [ value, unit ] = splitValueAndUnitFromSize( cssValue );
			expect( value ).toBe( expectedValue );
			expect( unit ).toBe( expectedUnit );
		}
	);
} );
