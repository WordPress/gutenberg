/**
 * Internal dependencies
 */
import { convertLTRToRTL } from '../rtl';

describe( 'convertLTRToRTL', () => {
	it( 'converts (*)Left <-> (*)Right', () => {
		const style = {
			// Left values.
			borderLeft: '10px solid red',
			borderLeftColor: 'red',
			borderLeftStyle: 'solid',
			borderLeftWidth: 10,
			borderTopLeftRadius: 10,
			marginLeft: 10,
			scrollMarginLeft: 10,
			scrollPaddingLeft: 10,
			// Right values.
			paddingLeft: 10,
			borderRight: '20px solid blue',
			borderRightColor: 'blue',
			borderRightStyle: 'dashed',
			borderRightWidth: 20,
			borderTopRightRadius: 20,
			marginRight: 20,
			paddingRight: 20,
			scrollMarginRight: 20,
			scrollPaddingRight: 20,
			// Edge cases.
			textCombineUpright: 'none',
		};
		const nextStyle = convertLTRToRTL( style );

		expect( Object.keys( style ).length ).toBe(
			Object.keys( nextStyle ).length
		);

		// Left -> Right.
		expect( nextStyle.borderRight ).toBe( '10px solid red' );
		expect( nextStyle.borderRightColor ).toBe( 'red' );
		expect( nextStyle.borderRightStyle ).toBe( 'solid' );
		expect( nextStyle.borderRightWidth ).toBe( 10 );
		expect( nextStyle.borderTopRightRadius ).toBe( 10 );
		expect( nextStyle.marginRight ).toBe( 10 );
		expect( nextStyle.paddingRight ).toBe( 10 );
		expect( nextStyle.scrollMarginRight ).toBe( 10 );
		expect( nextStyle.scrollPaddingRight ).toBe( 10 );

		// Right -> Left.
		expect( nextStyle.borderLeft ).toBe( '20px solid blue' );
		expect( nextStyle.borderLeftColor ).toBe( 'blue' );
		expect( nextStyle.borderLeftStyle ).toBe( 'dashed' );
		expect( nextStyle.borderLeftWidth ).toBe( 20 );
		expect( nextStyle.borderTopLeftRadius ).toBe( 20 );
		expect( nextStyle.marginLeft ).toBe( 20 );
		expect( nextStyle.paddingLeft ).toBe( 20 );
		expect( nextStyle.scrollMarginLeft ).toBe( 20 );
		expect( nextStyle.scrollPaddingLeft ).toBe( 20 );

		// Edge cases.
		expect( nextStyle.textCombineUpright ).toBe( 'none' );
	} );

	it( 'converts (*)left <-> (*)right', () => {
		const style = {
			// Left values.
			'border-left': '10px solid red',
			'border-left-color': 'red',
			'border-left-style': 'solid',
			'border-left-width': 10,
			'border-top-left-radius': 10,
			'margin-left': 10,
			'padding-left': 10,
			'scroll-margin-left': 10,
			'scroll-padding-left': 10,
			left: 10,
			// Right values.
			'border-right': '20px solid blue',
			'border-right-color': 'blue',
			'border-right-style': 'dashed',
			'border-right-width': 20,
			'border-top-right-radius': 20,
			'margin-right': 20,
			'padding-right': 20,
			'scroll-margin-right': 20,
			'scroll-padding-right': 20,
			right: 20,
			// Edge cases.
			'text-combine-upright': 'none',
		};
		const nextStyle = convertLTRToRTL( style );

		expect( Object.keys( style ).length ).toBe(
			Object.keys( nextStyle ).length
		);

		// Left -> right.
		expect( nextStyle[ 'border-right' ] ).toBe( '10px solid red' );
		expect( nextStyle[ 'border-right-color' ] ).toBe( 'red' );
		expect( nextStyle[ 'border-right-style' ] ).toBe( 'solid' );
		expect( nextStyle[ 'border-right-width' ] ).toBe( 10 );
		expect( nextStyle[ 'border-top-right-radius' ] ).toBe( 10 );
		expect( nextStyle[ 'margin-right' ] ).toBe( 10 );
		expect( nextStyle[ 'padding-right' ] ).toBe( 10 );
		expect( nextStyle[ 'scroll-margin-right' ] ).toBe( 10 );
		expect( nextStyle[ 'scroll-padding-right' ] ).toBe( 10 );
		expect( nextStyle.right ).toBe( 10 );

		// Right -> left.
		expect( nextStyle[ 'border-left' ] ).toBe( '20px solid blue' );
		expect( nextStyle[ 'border-left-color' ] ).toBe( 'blue' );
		expect( nextStyle[ 'border-left-style' ] ).toBe( 'dashed' );
		expect( nextStyle[ 'border-left-width' ] ).toBe( 20 );
		expect( nextStyle[ 'border-top-left-radius' ] ).toBe( 20 );
		expect( nextStyle[ 'margin-left' ] ).toBe( 20 );
		expect( nextStyle[ 'padding-left' ] ).toBe( 20 );
		expect( nextStyle[ 'scroll-margin-left' ] ).toBe( 20 );
		expect( nextStyle[ 'scroll-padding-left' ] ).toBe( 20 );
		expect( nextStyle.left ).toBe( 20 );

		// Edge cases.
		expect( nextStyle[ 'text-combine-upright' ] ).toBe( 'none' );
	} );
} );
