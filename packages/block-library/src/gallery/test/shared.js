import { isGalleryFlexLayout } from '../shared';

describe( 'isGalleryFlexLayout', () => {
	it.each( [
		[ 'missing', undefined ],
		[ 'null', null ],
		[ 'a string', 'grid' ],
		[ 'an array', [ 'grid' ] ],
		[ 'an object without a type', {} ],
		[ 'an object with an empty type', { type: '' } ],
		[ 'an explicit Flex layout', { type: 'flex' } ],
	] )( 'treats %s layout data as Flex', ( label, layout ) => {
		expect( isGalleryFlexLayout( layout ) ).toBe( true );
	} );

	it.each( [
		[ 'Grid', { type: 'grid' } ],
		[ 'another explicit layout type', { type: 'constrained' } ],
	] )( 'does not treat %s as Flex', ( label, layout ) => {
		expect( isGalleryFlexLayout( layout ) ).toBe( false );
	} );
} );
