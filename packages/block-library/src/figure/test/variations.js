/**
 * Internal dependencies
 */
import variations from '../variations';

describe( 'core/figure variations', () => {
	it( 'should export exactly 5 distinct layouts', () => {
		expect( variations ).toHaveLength( 5 );
	} );

	it( 'should map variation keys correctly', () => {
		const expectedNames = [
			'before-after',
			'data-set',
			'code-console',
			'multimedia',
			'document-resource',
		];

		const variationNames = variations.map( ( v ) => v.name );
		expect( variationNames ).toEqual( expectedNames );
	} );

	it( 'should structure the before-after variation with nested columns', () => {
		const beforeAfter = variations.find(
			( v ) => v.name === 'before-after'
		);

		expect( beforeAfter.attributes.layout.type ).toBe( 'default' );

		const [ rootBlockName, , rootInnerBlocks ] =
			beforeAfter.innerBlocks[ 0 ];
		expect( rootBlockName ).toBe( 'core/columns' );
		expect( rootInnerBlocks ).toHaveLength( 2 );

		const [ colName, , colInnerBlocks ] = rootInnerBlocks[ 0 ];
		expect( colName ).toBe( 'core/column' );
		expect( colInnerBlocks[ 0 ][ 0 ] ).toBe( 'core/heading' );
		expect( colInnerBlocks[ 1 ][ 0 ] ).toBe( 'core/image' );
		expect( colInnerBlocks[ 2 ][ 0 ] ).toBe( 'core/paragraph' );
	} );

	it( 'should structure the data-set variation with a table', () => {
		const dataSet = variations.find( ( v ) => v.name === 'data-set' );

		const [ rootBlockName, rootAttributes, rootInnerBlocks ] =
			dataSet.innerBlocks[ 0 ];
		expect( rootBlockName ).toBe( 'core/group' );
		expect( rootAttributes.layout.type ).toBe( 'constrained' );

		expect( rootInnerBlocks[ 0 ][ 0 ] ).toBe( 'core/image' );
		expect( rootInnerBlocks[ 1 ][ 0 ] ).toBe( 'core/table' );
	} );

	it( 'should strictly enforce block scope for all variations', () => {
		variations.forEach( ( variation ) => {
			expect( variation.scope ).toEqual( [ 'block' ] );
		} );
	} );
} );
