/**
 * Internal dependencies
 */
import { convertLtrToRtl } from '../rtl';

describe( 'convertLtrToRtl', () => {
	it( 'converts (*)Left to (*)Right', () => {
		const style = {
			borderLeft: '10px solid red',
			borderLeftColor: 'red',
			borderLeftStyle: 'solid',
			borderLeftWidth: 10,
			borderTopLeftRadius: 10,
			marginLeft: 10,
			paddingLeft: 10,
		};
		const nextStyle = convertLtrToRtl( style );

		expect( Object.keys( style ).length ).toBe(
			Object.keys( nextStyle ).length
		);

		expect( nextStyle.borderRight ).toBe( '10px solid red' );
		expect( nextStyle.borderRightColor ).toBe( 'red' );
		expect( nextStyle.borderRightStyle ).toBe( 'solid' );
		expect( nextStyle.borderRightWidth ).toBe( 10 );
		expect( nextStyle.borderTopRightRadius ).toBe( 10 );
		expect( nextStyle.marginRight ).toBe( 10 );
		expect( nextStyle.paddingRight ).toBe( 10 );
	} );

	it( 'converts (*)left to (*)right', () => {
		const style = {
			'border-left': '10px solid red',
			'border-left-color': 'red',
			'border-left-style': 'solid',
			'border-left-width': 10,
			'border-top-left-radius': 10,
			'margin-left': 10,
			'padding-left': 10,
			left: 10,
		};
		const nextStyle = convertLtrToRtl( style );

		expect( Object.keys( style ).length ).toBe(
			Object.keys( nextStyle ).length
		);

		expect( nextStyle[ 'border-right' ] ).toBe( '10px solid red' );
		expect( nextStyle[ 'border-right-color' ] ).toBe( 'red' );
		expect( nextStyle[ 'border-right-style' ] ).toBe( 'solid' );
		expect( nextStyle[ 'border-right-width' ] ).toBe( 10 );
		expect( nextStyle[ 'border-top-right-radius' ] ).toBe( 10 );
		expect( nextStyle[ 'margin-right' ] ).toBe( 10 );
		expect( nextStyle[ 'padding-right' ] ).toBe( 10 );
		expect( nextStyle.right ).toBe( 10 );
	} );
} );
