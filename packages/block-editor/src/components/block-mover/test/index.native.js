/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockMover } from '../index';

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
				onLongPress: jest.fn(),

				rootClientId: '',
				isStackedHorizontally: true,
			},
		} );
		expect( wrapper ).toBeTruthy();
	} );

	it( 'should match snapshot', () => {
		const wrapper = shallow( <BlockMover />, {
			context: {
				isFirst: false,
				isLast: true,
				isLocked: false,
				numberOfBlocks: 2,
				firstIndex: 1,

				onMoveDown: jest.fn(),
				onMoveUp: jest.fn(),
				onLongPress: jest.fn(),

				rootClientId: '',
				isStackedHorizontally: true,
			},
		} );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
