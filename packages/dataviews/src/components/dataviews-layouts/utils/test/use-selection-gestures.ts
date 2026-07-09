/**
 * Internal dependencies
 */
import { getRangeSelection } from '../use-selection-gestures';

const orderedIds = [ '1', '2', '3', '4', '5' ];

describe( 'getRangeSelection', () => {
	it( 'selects the range between the anchor and the target, inclusive', () => {
		expect(
			getRangeSelection( {
				anchorId: '2',
				targetId: '4',
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
				orderedIds,
				selection: [ '1', '3' ],
			} )
		).toEqual( [ '1', '3', '4' ] );
	} );

	it( 'deselects the range when the target is selected', () => {
		expect(
			getRangeSelection( {
				anchorId: '4',
				targetId: '2',
				orderedIds,
				selection: [ '1', '2', '3' ],
			} )
		).toEqual( [ '1' ] );
	} );

	it( 'selects the range when the target is not selected, regardless of the anchor state', () => {
		// The anchor ('2') was just deselected; shift-clicking the unselected
		// '4' still selects the whole range.
		expect(
			getRangeSelection( {
				anchorId: '2',
				targetId: '4',
				orderedIds,
				selection: [],
			} )
		).toEqual( [ '2', '3', '4' ] );
	} );

	it( 'toggles the target on when there is no anchor', () => {
		expect(
			getRangeSelection( {
				anchorId: null,
				targetId: '3',
				orderedIds,
				selection: [ '1' ],
			} )
		).toEqual( [ '1', '3' ] );
	} );

	it( 'toggles the target off when there is no anchor and the target is selected', () => {
		expect(
			getRangeSelection( {
				anchorId: null,
				targetId: '3',
				orderedIds,
				selection: [ '1', '3' ],
			} )
		).toEqual( [ '1' ] );
	} );

	it( 'toggles the target when the anchor is not in the ordered list', () => {
		expect(
			getRangeSelection( {
				anchorId: '42',
				targetId: '3',
				orderedIds,
				selection: [],
			} )
		).toEqual( [ '3' ] );
	} );

	it( 'returns the selection unchanged when the target is not in the ordered list', () => {
		expect(
			getRangeSelection( {
				anchorId: '1',
				targetId: '42',
				orderedIds,
				selection: [ '1', '2' ],
			} )
		).toEqual( [ '1', '2' ] );
	} );
} );
