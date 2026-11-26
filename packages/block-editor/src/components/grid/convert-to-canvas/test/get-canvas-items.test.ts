import { describe, expect, it } from 'vitest';
import { getCanvasItems, hasOwnLook } from '../get-canvas-items';
import type { CanvasBlock, CanvasItem } from '../types';

let id = 0;
function block(
	name: string,
	attributes: Record< string, any > = {},
	innerBlocks: CanvasBlock[] = []
): CanvasBlock {
	id++;
	return { clientId: `block-${ id }`, name, attributes, innerBlocks };
}

// Names of an item's blocks, with `stack:` for a Stack.
function describeItem( item: CanvasItem ) {
	const names = item.blocks.map( ( { name } ) =>
		name.replace( 'core/', '' )
	);
	return item.type === 'stack'
		? `stack:${ names.join( ',' ) }`
		: names.join( ',' );
}

describe( 'hasOwnLook', () => {
	it( 'is true for a background, border, shadow or class', () => {
		expect(
			hasOwnLook( block( 'core/group', { backgroundColor: 'base' } ) )
		).toBe( true );
		expect(
			hasOwnLook(
				block( 'core/group', {
					style: { border: { width: '1px' } },
				} )
			)
		).toBe( true );
		expect(
			hasOwnLook( block( 'core/group', { style: { shadow: 'x' } } ) )
		).toBe( true );
		expect(
			hasOwnLook( block( 'core/group', { className: 'is-style-x' } ) )
		).toBe( true );
	} );

	it( 'is false for padding and layout', () => {
		expect(
			hasOwnLook(
				block( 'core/group', {
					style: { spacing: { padding: { top: '1em' } } },
					layout: { type: 'constrained' },
				} )
			)
		).toBe( false );
	} );
} );

describe( 'getCanvasItems', () => {
	it( 'dissolves Columns and keeps a Column of text as a Stack', () => {
		const textColumn = block(
			'core/column',
			{ verticalAlignment: 'center' },
			[
				block( 'core/heading' ),
				block( 'core/paragraph' ),
				block( 'core/buttons', {}, [ block( 'core/button' ) ] ),
			]
		);
		const imageColumn = block( 'core/column', {}, [
			block( 'core/image' ),
		] );
		const columns = block( 'core/columns', { align: 'wide' }, [
			textColumn,
			imageColumn,
		] );
		const root = block( 'core/group', {}, [ columns ] );

		const items = getCanvasItems( root );

		expect( items.map( describeItem ) ).toEqual( [
			'stack:heading,paragraph,buttons',
			'image',
		] );
		expect( items[ 0 ].column ).toBe( textColumn );
		expect( items[ 0 ].verticalAlignment ).toBe( 'center' );
		expect( items[ 0 ].ancestors ).toEqual( [ columns ] );
		expect( items[ 1 ].ancestors ).toEqual( [ columns, imageColumn ] );
	} );

	it( 'takes the vertical alignment of Columns when a Column has none', () => {
		const root = block( 'core/group', {}, [
			block( 'core/columns', { verticalAlignment: 'bottom' }, [
				block( 'core/column', {}, [ block( 'core/paragraph' ) ] ),
			] ),
		] );

		expect( getCanvasItems( root )[ 0 ].verticalAlignment ).toBe(
			'bottom'
		);
	} );

	it( 'keeps consecutive text blocks together and drops spacers', () => {
		const root = block( 'core/group', {}, [
			block( 'core/heading' ),
			block( 'core/paragraph' ),
			block( 'core/spacer' ),
			block( 'core/paragraph' ),
			block( 'core/image' ),
			block( 'core/list' ),
			block( 'core/buttons' ),
		] );

		expect( getCanvasItems( root ).map( describeItem ) ).toEqual( [
			'stack:heading,paragraph',
			'paragraph',
			'image',
			'stack:list,buttons',
		] );
	} );

	it( 'keeps a Group with a look of its own whole', () => {
		const card = block( 'core/group', { backgroundColor: 'contrast' }, [
			block( 'core/image' ),
			block( 'core/paragraph' ),
		] );
		const root = block( 'core/group', {}, [ card ] );

		expect( getCanvasItems( root ) ).toEqual( [
			{ type: 'block', blocks: [ card ], ancestors: [] },
		] );
	} );

	it( 'keeps a Group of text as it is and dissolves a mixed one', () => {
		const textGroup = block( 'core/group', {}, [
			block( 'core/heading' ),
			block( 'core/paragraph' ),
		] );
		const mixedGroup = block( 'core/group', {}, [
			block( 'core/image' ),
			block( 'core/heading' ),
			block( 'core/paragraph' ),
		] );
		const root = block( 'core/group', {}, [ textGroup, mixedGroup ] );

		const items = getCanvasItems( root );

		expect( items.map( describeItem ) ).toEqual( [
			'group',
			'image',
			'stack:heading,paragraph',
		] );
		expect( items[ 2 ].ancestors ).toEqual( [ mixedGroup ] );
	} );

	it( 'keeps a Group in grid layout, whose grid places its children', () => {
		const grid = block( 'core/group', { layout: { type: 'grid' } }, [
			block( 'core/image' ),
			block( 'core/image' ),
		] );

		expect(
			getCanvasItems( block( 'core/group', {}, [ grid ] ) ).map(
				describeItem
			)
		).toEqual( [ 'group' ] );
	} );

	it( 'keeps a Column with a look of its own as one item', () => {
		const column = block( 'core/column', { backgroundColor: 'accent' }, [
			block( 'core/image' ),
			block( 'core/paragraph' ),
		] );
		const root = block( 'core/group', {}, [
			block( 'core/columns', {}, [ column ] ),
		] );

		expect( getCanvasItems( root ).map( describeItem ) ).toEqual( [
			'column',
		] );
	} );

	it( 'places the columns of Columns that become the canvas', () => {
		const root = block( 'core/columns', {}, [
			block( 'core/column', {}, [ block( 'core/paragraph' ) ] ),
			block( 'core/column', {}, [
				block( 'core/image' ),
				block( 'core/image' ),
			] ),
		] );

		const items = getCanvasItems( root );

		expect( items.map( describeItem ) ).toEqual( [
			'stack:paragraph',
			'image',
			'image',
		] );
		expect( items[ 1 ].ancestors ).toEqual( [ root.innerBlocks[ 1 ] ] );
	} );

	it( 'keeps blocks that own their children whole', () => {
		const root = block( 'core/group', {}, [
			block( 'core/cover', {}, [ block( 'core/paragraph' ) ] ),
			block( 'core/media-text', {}, [ block( 'core/paragraph' ) ] ),
			block( 'core/navigation' ),
		] );

		expect( getCanvasItems( root ).map( describeItem ) ).toEqual( [
			'cover',
			'media-text',
			'navigation',
		] );
	} );
} );
