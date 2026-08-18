import { isMediaDragEligible } from '../utils';

describe( 'isMediaDragEligible', () => {
	it( 'accepts a single allowed block dragged from the canvas', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/image' ],
				allowedTypes: [ 'image' ],
				multiple: false,
			} )
		).toBe( true );
	} );

	it( 'accepts bare names as reported by inserter drags', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'image' ],
				allowedTypes: [ 'image' ],
				multiple: false,
			} )
		).toBe( true );
	} );

	it( 'rejects a block whose type is not allowed', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/paragraph' ],
				allowedTypes: [ 'image' ],
				multiple: true,
			} )
		).toBe( false );
	} );

	it( 'rejects a drag whose contents could not be identified', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [],
				allowedTypes: [ 'image' ],
				multiple: true,
			} )
		).toBe( false );
	} );

	it( 'rejects several blocks when only one is accepted', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/image', 'core/image' ],
				allowedTypes: [ 'image' ],
				multiple: false,
			} )
		).toBe( false );
	} );

	it( 'accepts several blocks when many are accepted', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/image', 'core/image' ],
				allowedTypes: [ 'image' ],
				multiple: true,
			} )
		).toBe( true );
	} );

	it( 'rejects a mixed drag when one block is not allowed', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/image', 'core/paragraph' ],
				allowedTypes: [ 'image', 'video' ],
				multiple: true,
			} )
		).toBe( false );
	} );

	it( 'rejects rather than throwing when no types are allowed', () => {
		expect(
			isMediaDragEligible( {
				blockNames: [ 'core/image' ],
				allowedTypes: undefined,
				multiple: true,
			} )
		).toBe( false );
	} );
} );
