/**
 * Internal dependencies
 */
import { space } from '..';
import { getScaleStyles } from '../css';

describe( 'scales', () => {
	test( 'should transform space values', () => {
		const numberValues = {
			gridGap: 4,
			gridColumnGap: 4,
			gridRowGap: 4,
			gap: 4,
			columnGap: 4,
			rowGap: 4,
		};

		for ( const key in numberValues ) {
			const value = numberValues[ key ];
			const assert = {};
			const result = {};

			assert[ key ] = value;
			result[ key ] = space( value );

			expect( getScaleStyles( assert ) ).toEqual( result );
		}

		const stringValues = {
			gridGap: '6px',
			gridColumnGap: '6px',
			gridRowGap: '6px',
			gap: '6px',
			columnGap: '6px',
			rowGap: '6px',
		};

		for ( const key in stringValues ) {
			const value = stringValues[ key ];
			const assert = {};
			const result = {};

			assert[ key ] = value;
			result[ key ] = space( value );

			expect( getScaleStyles( assert ) ).toEqual( result );
		}
	} );
} );
