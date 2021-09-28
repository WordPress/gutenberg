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
		const props = {
			isFirst: false,
			isLast: true,
			canMove: true,
			numberOfBlocks: 2,
			firstIndex: 1,

			onMoveDown: jest.fn(),
			onMoveUp: jest.fn(),
			onLongPress: jest.fn(),

			rootClientId: '',
			isStackedHorizontally: true,
		};
		const wrapper = shallow( <BlockMover { ...props } /> );
		expect( wrapper ).toBeTruthy();
	} );

	it( 'should match snapshot', () => {
		const props = {
			isFirst: false,
			isLast: true,
			canMove: true,
			numberOfBlocks: 2,
			firstIndex: 1,

			onMoveDown: jest.fn(),
			onMoveUp: jest.fn(),
			onLongPress: jest.fn(),

			rootClientId: '',
			isStackedHorizontally: true,
		};
		const wrapper = shallow( <BlockMover { ...props } /> );
		expect( wrapper ).toMatchSnapshot();
	} );
} );
