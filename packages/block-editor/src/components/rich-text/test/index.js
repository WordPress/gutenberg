/**
 * Internal dependencies
 */
import { pickAriaProps } from '../aria';

describe( 'RichText', () => {
	describe( 'pickAriaProps()', () => {
		it( 'should should filter all properties to only those begining with "aria-"', () => {
			expect( pickAriaProps( {
				tagName: 'p',
				className: 'class1 class2',
				'aria-label': 'my label',
				style: {
					backgroundColor: 'white',
					color: 'black',
					fontSize: '12px',
					textAlign: 'left',
				},
				'aria-owns': 'some-id',
				'not-aria-prop': 'value',
				ariaWithoutDash: 'value',
			} ) ).toEqual( {
				'aria-label': 'my label',
				'aria-owns': 'some-id',
			} );
		} );
	} );
} );
