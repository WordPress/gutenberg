import { describe, expect, it } from 'vitest';
import { getChildLayoutStyle, getChildLayoutsByState } from '../child-layout';

const layout = { columnStart: 1, rowStart: 2 };
const mobileLayout = { columnStart: 1, rowStart: 1, columnSpan: 2 };
const style = {
	color: { text: 'red' },
	layout,
	'@mobile': { layout: mobileLayout, color: { text: 'blue' } },
	'@tablet': { color: { text: 'green' } },
};

describe( 'getChildLayoutsByState()', () => {
	it( 'keeps only the layouts, by state', () => {
		expect( getChildLayoutsByState( style ) ).toEqual( {
			layout,
			'@mobile': mobileLayout,
		} );
	} );

	it( "holds the style's own layout objects", () => {
		const layouts = getChildLayoutsByState( {
			...style,
			color: { text: 'black' },
		} );
		expect( layouts.layout ).toBe( layout );
		expect( layouts[ '@mobile' ] ).toBe( mobileLayout );
	} );

	it( 'gives no layouts for a style without any', () => {
		expect( getChildLayoutsByState( undefined ) ).toEqual( {} );
		expect( getChildLayoutsByState( { color: {} } ) ).toEqual( {} );
	} );
} );

describe( 'getChildLayoutStyle()', () => {
	it( 'builds a style with only the layouts', () => {
		expect(
			getChildLayoutStyle( getChildLayoutsByState( style ) )
		).toEqual( {
			layout,
			'@mobile': { layout: mobileLayout },
		} );
	} );
} );
