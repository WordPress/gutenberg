import { describe, expect, it } from 'vitest';
import {
	findBlocks,
	getSitePartContents,
	replaceBlock,
	type SitePartBlock,
} from '../get-site-part-contents';

const block = (
	name: string,
	attributes: Record< string, any > = {},
	innerBlocks: SitePartBlock[] = []
): SitePartBlock => ( { name, attributes, innerBlocks } );

const link = block( 'core/navigation-link', { label: 'Blog' } );
const footer = [
	block( 'core/group', {}, [
		block( 'core/site-title' ),
		block( 'core/group', {}, [
			block( 'core/navigation', { ariaLabel: 'Footer 1' }, [ link ] ),
			block( 'core/navigation', { ariaLabel: 'Footer 2' }, [ link ] ),
		] ),
	] ),
	block( 'core/navigation', { ref: 5 } ),
];

describe( 'findBlocks', () => {
	it( 'lists every block with the name in document order', () => {
		expect(
			findBlocks( footer, 'core/navigation' ).map(
				( { attributes } ) => attributes.ariaLabel ?? attributes.ref
			)
		).toEqual( [ 'Footer 1', 'Footer 2', 5 ] );
	} );

	it( 'returns nothing when no block has the name', () => {
		expect( findBlocks( footer, 'core/social-links' ) ).toEqual( [] );
		expect( findBlocks( undefined, 'core/navigation' ) ).toEqual( [] );
	} );
} );

describe( 'getSitePartContents', () => {
	it( 'offers a menu slot for each Navigation block, with links or not', () => {
		expect( getSitePartContents( footer ).navigations ).toHaveLength( 3 );
	} );
} );

describe( 'replaceBlock', () => {
	it( 'replaces only the block at the position', () => {
		const next = replaceBlock( footer, 'core/navigation', 1, ( item ) => ( {
			...item,
			attributes: { ...item.attributes, ref: 9 },
		} ) );
		expect(
			findBlocks( next, 'core/navigation' ).map(
				( { attributes } ) => attributes.ref
			)
		).toEqual( [ undefined, 9, 5 ] );
		// Untouched branches keep their identity.
		expect( next[ 1 ] ).toBe( footer[ 1 ] );
	} );

	it( 'returns the same blocks when there is no block at the position', () => {
		expect(
			replaceBlock( footer, 'core/navigation', 3, ( item ) => item )
		).toBe( footer );
	} );
} );
