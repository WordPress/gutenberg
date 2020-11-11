/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import {
	BlockMover,
	BLOCK_MOVER_DIRECTION_TOP,
	BLOCK_MOVER_DIRECTION_BOTTOM,
} from '../index';

describe( 'Block Mover Picker', () => {
	it( 'renders without crashing', () => {
		const wrapper = shallow( <BlockMover />, {
			context: {
				isFirst: false,
				isLast: true,
				isLocked: false,
				numberOfBlocks: 2,
				firstIndex: 1,

				onMoveDown: jest.fn(),
				onMoveUp: jest.fn(),
				onLongMove: jest.fn(),

				rootClientId: '',
				isStackedHorizontally: true,
			},
		} );
		expect( wrapper ).toBeTruthy();
	} );

	it( 'shows "Move to top" on picker when long pressing move up mover', () => {
		const wrapper = shallow( <BlockMover />, {
			context: {
				isFirst: false,
				isLast: true,
				isLocked: false,
				numberOfBlocks: 2,
				firstIndex: 1,

				onMoveDown: jest.fn(),
				onMoveUp: jest.fn(),
				onLongMove: jest.fn(),

				rootClientId: '',
				isStackedHorizontally: true,
			},
		} );
		jest.mock( wrapper.showBlockPageMover, () => {} );
		jest.mock(
			wrapper.blockPageMoverState,
			() => 'blockPageMoverOptions-moveToTop'
		);

		expect( wrapper.blockPageMoverOptions.length ).toEqual( 1 );
		expect( wrapper.blockPageMoverOptions[ 0 ].value ).toEqual(
			BLOCK_MOVER_DIRECTION_TOP
		);
	} );

	// it( 'moves block to first in list when pressing "Move to top"', () => {
	// 	// mock two blocks
	// 	// selected block should be on bottom
	// 	// long press up mover
	// 	// press move up button
	// } );
	//
	// it( 'shows "Move to bottom" on picker when long pressing move down mover', () => {} );
	//
	// it( 'moves block to last in list when pressing "Move to bottom"', () => {} );
	//
	// it( "can't long press move up when block is already first", () => {} );
	//
	// it( "can't long press move down when block is already last", () => {} );
} );
