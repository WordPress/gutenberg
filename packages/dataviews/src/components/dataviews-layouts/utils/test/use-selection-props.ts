/**
 * Internal dependencies
 */
import {
	getClosestSelectedId,
	getRangeSelection,
} from '../use-selection-props';

const orderedIds = [ '1', '2', '3', '4', '5' ];

describe( 'getRangeSelection', () => {
	it( 'selects the range between the anchor and the target, inclusive', () => {
		expect(
			getRangeSelection( {
				anchorId: '2',
				targetId: '4',
				lastTargetId: null,
				orderedIds,
				selection: [ '2' ],
			} )
		).toEqual( [ '2', '3', '4' ] );
	} );

	it( 'selects the range when the target precedes the anchor', () => {
		expect(
			getRangeSelection( {
				anchorId: '4',
				targetId: '2',
				lastTargetId: null,
				orderedIds,
				selection: [ '4' ],
			} )
		).toEqual( [ '4', '2', '3' ] );
	} );

	it( 'keeps selected items outside the range', () => {
		expect(
			getRangeSelection( {
				anchorId: '3',
				targetId: '4',
				lastTargetId: null,
				orderedIds,
				selection: [ '1', '3' ],
			} )
		).toEqual( [ '1', '3', '4' ] );
	} );

	it( 'leaves the target selected when it is already selected', () => {
		expect(
			getRangeSelection( {
				anchorId: '4',
				targetId: '2',
				lastTargetId: null,
				orderedIds,
				selection: [ '1', '2', '3' ],
			} )
		).toEqual( [ '1', '2', '3', '4' ] );
	} );

	it( 'selects the range when the target is not selected, regardless of the anchor state', () => {
		// The anchor ('2') was just deselected; shift-clicking the unselected
		// '4' still selects the whole range.
		expect(
			getRangeSelection( {
				anchorId: '2',
				targetId: '4',
				lastTargetId: null,
				orderedIds,
				selection: [],
			} )
		).toEqual( [ '2', '3', '4' ] );
	} );

	it( 'redefines the range from the anchor when the direction reverses', () => {
		// Click '3', Shift+Click '5', then Shift+Click '1'.
		expect(
			getRangeSelection( {
				anchorId: '3',
				targetId: '1',
				lastTargetId: '5',
				orderedIds,
				selection: [ '3', '4', '5' ],
			} )
		).toEqual( [ '1', '2', '3' ] );
	} );

	it( 'shrinks the range when the target moves back towards the anchor', () => {
		// Click '1', Shift+Click '5', then Shift+Click '3'.
		expect(
			getRangeSelection( {
				anchorId: '1',
				targetId: '3',
				lastTargetId: '5',
				orderedIds,
				selection: [ '1', '2', '3', '4', '5' ],
			} )
		).toEqual( [ '1', '2', '3' ] );
	} );

	it( 'reduces the range to the anchor when the target is the anchor', () => {
		expect(
			getRangeSelection( {
				anchorId: '3',
				targetId: '3',
				lastTargetId: '5',
				orderedIds,
				selection: [ '3', '4', '5' ],
			} )
		).toEqual( [ '3' ] );
	} );

	it( 'discards only the previous range when the direction reverses', () => {
		// '1' was selected before the range gesture started, so it survives
		// while the previous range ('4', '5') is dropped.
		expect(
			getRangeSelection( {
				anchorId: '3',
				targetId: '2',
				lastTargetId: '5',
				orderedIds,
				selection: [ '1', '3', '4', '5' ],
			} )
		).toEqual( [ '1', '2', '3' ] );
	} );

	it( 'selects the target when there is no anchor', () => {
		expect(
			getRangeSelection( {
				anchorId: null,
				targetId: '3',
				lastTargetId: null,
				orderedIds,
				selection: [ '1' ],
			} )
		).toEqual( [ '1', '3' ] );
	} );

	it( 'leaves the target selected when there is no anchor', () => {
		expect(
			getRangeSelection( {
				anchorId: null,
				targetId: '3',
				lastTargetId: null,
				orderedIds,
				selection: [ '1', '3' ],
			} )
		).toEqual( [ '1', '3' ] );
	} );

	it( 'selects the target when the anchor is not in the ordered list', () => {
		expect(
			getRangeSelection( {
				anchorId: '42',
				targetId: '3',
				lastTargetId: null,
				orderedIds,
				selection: [],
			} )
		).toEqual( [ '3' ] );
	} );

	it( 'starts a new range when the anchor is no longer in the ordered list', () => {
		expect(
			getRangeSelection( {
				anchorId: '42',
				targetId: '3',
				lastTargetId: '5',
				orderedIds,
				selection: [ '3', '4', '5' ],
			} )
		).toEqual( [ '3', '4', '5' ] );
	} );

	it( 'returns the selection unchanged when the target is not in the ordered list', () => {
		expect(
			getRangeSelection( {
				anchorId: '1',
				targetId: '42',
				lastTargetId: null,
				orderedIds,
				selection: [ '1', '2' ],
			} )
		).toEqual( [ '1', '2' ] );
	} );
} );

describe( 'getClosestSelectedId', () => {
	it( 'returns the selected item nearest the target', () => {
		expect(
			getClosestSelectedId( {
				targetId: '2',
				orderedIds,
				selection: [ '1', '5' ],
			} )
		).toBe( '1' );
	} );

	it( 'returns the target when the target itself is selected', () => {
		expect(
			getClosestSelectedId( {
				targetId: '3',
				orderedIds,
				selection: [ '1', '3' ],
			} )
		).toBe( '3' );
	} );

	it( 'resolves ties to the earlier item', () => {
		expect(
			getClosestSelectedId( {
				targetId: '3',
				orderedIds,
				selection: [ '2', '4' ],
			} )
		).toBe( '2' );
	} );

	it( 'returns null when nothing is selected', () => {
		expect(
			getClosestSelectedId( {
				targetId: '3',
				orderedIds,
				selection: [],
			} )
		).toBeNull();
	} );

	it( 'ignores selected items that are not in the ordered list', () => {
		expect(
			getClosestSelectedId( {
				targetId: '3',
				orderedIds,
				selection: [ '42' ],
			} )
		).toBeNull();
	} );

	it( 'returns null when the target is not in the ordered list', () => {
		expect(
			getClosestSelectedId( {
				targetId: '42',
				orderedIds,
				selection: [ '1' ],
			} )
		).toBeNull();
	} );
} );
