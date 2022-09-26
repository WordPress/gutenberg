/**
 * External dependencies
 */
import { render } from 'test/helpers';

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
		const screen = render( <BlockMover { ...props } /> );
		expect( screen.container ).toBeTruthy();
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
		const screen = render( <BlockMover { ...props } /> );
		expect( screen.toJSON() ).toMatchSnapshot();
	} );
} );
