/**
 * Internal dependencies
 */
import { isSimpleCssValue, getCommonSizeUnit } from '../utils';

describe( 'isSimpleCssValue', () => {
	test.each( [
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
	] )( 'given %p as argument, returns %p', ( cssValue, result ) => {
		expect( isSimpleCssValue( cssValue ) ).toBe( result );
	} );
} );

describe( 'getCommonSizeUnit', () => {
	it( 'returns null when fontSizes is empty', () => {
		expect( getCommonSizeUnit( [] ) ).toBe( null );
	} );

	it( 'returns px when all sizes are px', () => {
		expect(
			getCommonSizeUnit( [
				{ slug: 'small', size: '10px' },
				{ slug: 'medium', size: '20px' },
				{ slug: 'large', size: '30px' },
			] )
		).toBe( 'px' );
	} );

	it( 'returns em when all sizes are em', () => {
		expect(
			getCommonSizeUnit( [
				{ slug: 'small', size: '1em' },
				{ slug: 'medium', size: '2em' },
				{ slug: 'large', size: '3em' },
			] )
		).toBe( 'em' );
	} );

	it( 'returns null when sizes are heterogeneous', () => {
		expect(
			getCommonSizeUnit( [
				{ slug: 'small', size: '10px' },
				{ slug: 'medium', size: '2em' },
				{ slug: 'large', size: '3rem' },
			] )
		).toBe( null );
	} );
} );
