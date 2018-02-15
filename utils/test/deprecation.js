/**
 * Internal dependencies
 */
import { deprecated } from '../deprecation';

describe( 'deprecated', () => {
	it( 'should show a deprecation warning', () => {
		deprecated( 'Eating meat' );

		expect( console ).toHaveWarnedWith(
			'Eating meat is deprecated and will be removed.'
		);
	} );

	it( 'should show a deprecation warning with a version', () => {
		deprecated( 'Eating meat', 'the future' );

		expect( console ).toHaveWarnedWith(
			'Eating meat is deprecated and will be removed in the future.'
		);
	} );

	it( 'should show a deprecation warning with an alternative', () => {
		deprecated( 'Eating meat', 'the future', 'vegetables' );

		expect( console ).toHaveWarnedWith(
			'Eating meat is deprecated and will be removed in the future. Please use vegetables instead.'
		);
	} );

	it( 'should show a deprecation warning with an alternative specific to a plugin', () => {
		deprecated( 'Eating meat', 'the future', 'vegetables', 'the earth' );

		expect( console ).toHaveWarnedWith(
			'Eating meat is deprecated and will be removed from the earth in the future. Please use vegetables instead.'
		);
	} );

	it( 'should show a deprecation warning with a link', () => {
		deprecated( 'Eating meat', 'the future', 'vegetables', 'the earth', 'https://en.wikipedia.org/wiki/Vegetarianism' );

		expect( console ).toHaveWarnedWith(
			'Eating meat is deprecated and will be removed from the earth in the future. Please use vegetables instead. See: https://en.wikipedia.org/wiki/Vegetarianism'
		);
	} );
} );
