/**
 * Internal dependencies
 */
import { describeMove } from '../suggestion-diff';

describe( 'describeMove', () => {
	it( 'reports upward distance for a same-parent move', () => {
		expect(
			describeMove( {
				fromIndex: 5,
				currentIndex: 2,
				sameParent: true,
				movedToRoot: false,
				parentTitle: '',
			} )
		).toBe( 'Moved up 3 blocks' );
	} );

	it( 'singularizes a one-position move', () => {
		expect(
			describeMove( {
				fromIndex: 1,
				currentIndex: 2,
				sameParent: true,
				movedToRoot: false,
				parentTitle: '',
			} )
		).toBe( 'Moved down 1 block' );
	} );

	it( 'reports downward distance for a same-parent move', () => {
		expect(
			describeMove( {
				fromIndex: 0,
				currentIndex: 4,
				sameParent: true,
				movedToRoot: false,
				parentTitle: '',
			} )
		).toBe( 'Moved down 4 blocks' );
	} );

	it( 'falls back to "Moved" when same-parent index is unchanged', () => {
		expect(
			describeMove( {
				fromIndex: 3,
				currentIndex: 3,
				sameParent: true,
				movedToRoot: false,
				parentTitle: '',
			} )
		).toBe( 'Moved' );
	} );

	it( 'describes a move into a named parent', () => {
		expect(
			describeMove( {
				fromIndex: 0,
				currentIndex: 0,
				sameParent: false,
				movedToRoot: false,
				parentTitle: 'Group',
			} )
		).toBe( 'Moved into Group' );
	} );

	it( 'describes a move out to the top level', () => {
		expect(
			describeMove( {
				fromIndex: 0,
				currentIndex: 1,
				sameParent: false,
				movedToRoot: true,
				parentTitle: '',
			} )
		).toBe( 'Moved to top level' );
	} );
} );
