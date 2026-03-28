/**
 * Internal dependencies
 */
import { cleanEmptyObject, buildStateResetAllFilter } from '../utils';

describe( 'cleanEmptyObject', () => {
	it( 'should remove nested keys', () => {
		expect( cleanEmptyObject( { color: { text: undefined } } ) ).toEqual(
			undefined
		);
	} );

	it( 'should remove partial nested keys', () => {
		expect(
			cleanEmptyObject( {
				color: { text: undefined },
				typography: { fontSize: '10px' },
			} )
		).toEqual( {
			typography: { fontSize: '10px' },
		} );
	} );

	it( 'should not remove falsy nested keys', () => {
		expect( cleanEmptyObject( { color: { text: false } } ) ).not.toEqual(
			undefined
		);
		expect( cleanEmptyObject( { color: { text: '' } } ) ).not.toEqual(
			undefined
		);
	} );
} );

describe( 'buildStateResetAllFilter', () => {
	it( 'should clear only the selected state styles and leave default styles intact', () => {
		const innerReset = ( style ) => ( { ...style, color: undefined } );
		const attributes = {
			style: {
				color: { text: '#000000' },
				':hover': { color: { text: '#ff0000' } },
			},
		};

		const result = buildStateResetAllFilter(
			':hover',
			innerReset
		)( attributes );

		expect( result.style[ ':hover' ] ).toBeUndefined();
		expect( result.style.color ).toEqual( { text: '#000000' } );
	} );

	it( 'should not affect other state keys', () => {
		const innerReset = () => ( {} );
		const attributes = {
			style: {
				':hover': { color: { text: '#ff0000' } },
				':focus': { color: { text: '#0000ff' } },
			},
		};

		const result = buildStateResetAllFilter(
			':hover',
			innerReset
		)( attributes );

		expect( result.style[ ':hover' ] ).toBeUndefined();
		expect( result.style[ ':focus' ] ).toEqual( {
			color: { text: '#0000ff' },
		} );
	} );

	it( 'should remove the state key entirely when inner reset returns an empty object', () => {
		const innerReset = () => ( {} );
		const attributes = {
			style: {
				':hover': { color: { text: '#ff0000' } },
			},
		};

		const result = buildStateResetAllFilter(
			':hover',
			innerReset
		)( attributes );

		expect( result.style ).toBeUndefined();
	} );

	it( 'should call the inner reset with an empty object when no state styles exist', () => {
		const innerReset = jest.fn( ( style ) => style );
		const attributes = {
			style: { color: { text: '#000000' } },
		};

		buildStateResetAllFilter( ':hover', innerReset )( attributes );

		expect( innerReset ).toHaveBeenCalledWith( {} );
	} );
} );
