import { describe, expect, it } from 'vitest';
import {
	applyStep,
	getColumnFractions,
	getHorizontalSteps,
} from '../get-horizontal-fractions';
import type { CanvasBlock, CanvasItem, Rect } from '../types';

let id = 0;
function block(
	name: string,
	attributes: Record< string, any > = {},
	innerBlocks: CanvasBlock[] = []
): CanvasBlock {
	id++;
	return { clientId: `block-${ id }`, name, attributes, innerBlocks };
}

// A 1180px wide canvas with 20px gaps: line space is 1200px wide, so a
// position of 300px is the fraction 0.25.
const WIDTH = 1180;
const GAP = 20;

function geometry( rects: Array< [ CanvasBlock, number, number ] > ) {
	return {
		rects: new Map< string, Rect >(
			rects.map( ( [ { clientId }, left, right ] ) => [
				clientId,
				{ left, right, top: 0, bottom: 100 },
			] )
		),
		insets: new Set< string >(),
		width: WIDTH,
		gap: GAP,
	};
}

function blockItem(
	item: CanvasBlock,
	ancestors: CanvasBlock[] = []
): CanvasItem {
	return { type: 'block', blocks: [ item ], ancestors };
}

describe( 'getColumnFractions', () => {
	it( 'reads percentage widths', () => {
		const columns = block( 'core/columns', {}, [
			block( 'core/column', { width: '25%' } ),
			block( 'core/column', { width: '75%' } ),
		] );
		expect( getColumnFractions( columns ) ).toEqual( [
			{ start: 0, end: 0.25 },
			{ start: 0.25, end: 1 },
		] );
	} );

	it( 'shares what is left between columns without a width', () => {
		const columns = block( 'core/columns', {}, [
			block( 'core/column', { width: '50%' } ),
			block( 'core/column' ),
			block( 'core/column' ),
		] );
		expect( getColumnFractions( columns ) ).toEqual( [
			{ start: 0, end: 0.5 },
			{ start: 0.5, end: 0.75 },
			{ start: 0.75, end: 1 },
		] );
	} );

	it( 'returns nothing for widths that are not percentages', () => {
		const columns = block( 'core/columns', {}, [
			block( 'core/column', { width: '200px' } ),
			block( 'core/column' ),
		] );
		expect( getColumnFractions( columns ) ).toBeUndefined();
	} );
} );

describe( 'applyStep', () => {
	it( 'narrows a frame', () => {
		const frame: [ number, number ] = [ 0.2, 0.6 ];
		const check = ( step: Parameters< typeof applyStep >[ 1 ] ) =>
			applyStep( frame, step ).map( ( value ) =>
				Number( value.toFixed( 6 ) )
			);
		expect( check( { type: 'split', start: 0.5, end: 1 } ) ).toEqual( [
			0.4, 0.6,
		] );
		expect( check( { type: 'center', size: 0.5 } ) ).toEqual( [
			0.3, 0.5,
		] );
		expect( check( { type: 'start', size: 0.25 } ) ).toEqual( [
			0.2, 0.3,
		] );
		expect( check( { type: 'end', size: 0.25 } ) ).toEqual( [ 0.5, 0.6 ] );
		expect( check( { type: 'measured', start: 0, end: 0.1 } ) ).toEqual( [
			0, 0.1,
		] );
	} );
} );

describe( 'getHorizontalSteps', () => {
	it( 'centers a content width block of a constrained canvas', () => {
		const paragraph = block( 'core/paragraph' );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			paragraph,
		] );
		expect(
			getHorizontalSteps(
				blockItem( paragraph ),
				root,
				geometry( [ [ paragraph, 300, 880 ] ] )
			)
		).toEqual( [ { type: 'center', size: 0.5 } ] );
	} );

	it( 'justifies a content width block to the right', () => {
		const paragraph = block( 'core/paragraph' );
		const root = block(
			'core/group',
			{ layout: { type: 'constrained', justifyContent: 'right' } },
			[ paragraph ]
		);
		expect(
			getHorizontalSteps(
				blockItem( paragraph ),
				root,
				geometry( [ [ paragraph, 600, 1180 ] ] )
			)
		).toEqual( [ { type: 'end', size: 0.5 } ] );
	} );

	it( 'splits the wide frame of Columns by their widths', () => {
		const image = block( 'core/image' );
		const firstColumn = block( 'core/column', { width: '50%' } );
		const secondColumn = block( 'core/column', { width: '50%' }, [
			image,
		] );
		const columns = block( 'core/columns', { align: 'wide' }, [
			firstColumn,
			secondColumn,
		] );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			columns,
		] );

		const steps = getHorizontalSteps(
			blockItem( image, [ columns, secondColumn ] ),
			root,
			geometry( [
				[ columns, 100, 1080 ],
				[ firstColumn, 100, 580 ],
				[ secondColumn, 600, 1080 ],
				[ image, 600, 1080 ],
			] )
		);

		expect( steps ).toEqual( [
			{ type: 'center', size: 1000 / 1200 },
			{ type: 'split', start: 0.5, end: 1 },
		] );
	} );

	it( 'measures a floated block', () => {
		const image = block( 'core/image', { align: 'right' } );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			image,
		] );
		expect(
			getHorizontalSteps(
				blockItem( image ),
				root,
				geometry( [ [ image, 880, 1180 ] ] )
			)
		).toEqual( [ { type: 'measured', start: 880 / 1200, end: 1 } ] );
	} );

	it( 'measures a block that is not where its attributes say', () => {
		const paragraph = block( 'core/paragraph' );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			paragraph,
		] );
		// Theme CSS moved it to the left edge.
		expect(
			getHorizontalSteps(
				blockItem( paragraph ),
				root,
				geometry( [ [ paragraph, 0, 580 ] ] )
			)
		).toEqual( [ { type: 'measured', start: 0, end: 0.5 } ] );
	} );

	it( 'measures the children of a flex container', () => {
		const button = block( 'core/buttons' );
		const row = block( 'core/group', { layout: { type: 'flex' } }, [
			button,
		] );
		const root = block( 'core/group', {}, [ row ] );
		expect(
			getHorizontalSteps(
				blockItem( button, [ row ] ),
				root,
				geometry( [
					[ row, 0, 1180 ],
					[ button, 0, 280 ],
				] )
			)
		).toEqual( [ { type: 'measured', start: 0, end: 0.25 } ] );
	} );

	it( 'measures a run of text whose blocks sit differently', () => {
		const heading = block( 'core/heading', { align: 'wide' } );
		const paragraph = block( 'core/paragraph' );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			heading,
			paragraph,
		] );
		const run: CanvasItem = {
			type: 'stack',
			blocks: [ heading, paragraph ],
			ancestors: [],
		};
		expect(
			getHorizontalSteps(
				run,
				root,
				geometry( [
					[ heading, 100, 1080 ],
					[ paragraph, 300, 880 ],
				] )
			)
		).toEqual( [
			{ type: 'measured', start: 100 / 1200, end: 1100 / 1200 },
		] );
	} );

	it( 'positions a run of text whose blocks sit the same way', () => {
		const heading = block( 'core/heading' );
		const paragraph = block( 'core/paragraph' );
		const root = block( 'core/group', { layout: { type: 'constrained' } }, [
			heading,
			paragraph,
		] );
		const run: CanvasItem = {
			type: 'stack',
			blocks: [ heading, paragraph ],
			ancestors: [],
		};
		expect(
			getHorizontalSteps(
				run,
				root,
				geometry( [
					[ heading, 300, 880 ],
					[ paragraph, 300, 880 ],
				] )
			)
		).toEqual( [ { type: 'center', size: 0.5 } ] );
	} );
} );
