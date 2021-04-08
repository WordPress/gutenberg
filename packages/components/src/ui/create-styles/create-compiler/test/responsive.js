/**
 * Internal dependencies
 */
import { responsive } from '../responsive';

describe( 'responsive', () => {
	test( 'should transform responsive space values', () => {
		const styles = {
			gap: [ 5, null, 10 ],
		};

		expect( responsive( styles ) ).toEqual( {
			gap: 5,
			'@media screen and (min-width: 40em)': {},
			'@media screen and (min-width: 52em)': {
				gap: 10,
			},
		} );
	} );

	test( 'should transform responsive space string values', () => {
		const styles = {
			gap: [ '5px', null, '10em' ],
		};

		expect( responsive( styles ) ).toEqual( {
			gap: '5px',
			'@media screen and (min-width: 40em)': {},
			'@media screen and (min-width: 52em)': {
				gap: '10em',
			},
		} );
	} );
} );
