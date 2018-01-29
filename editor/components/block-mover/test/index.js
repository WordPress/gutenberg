/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockMover } from '../';

describe( 'BlockMover', () => {
	describe( 'basic rendering', () => {
		const selectedUids = [ 'IisUID', 'IisOtherUID' ];

		const blockType = {
			title: 'yolo-block',
		};

		it( 'should not render if the editor is locked', () => {
			const wrapper = shallow( <BlockMover isLocked /> );
			expect( wrapper.type() ).toBe( null );
		} );

		it( 'should render two IconButton components with the following props', () => {
			const blockMover = shallow( <BlockMover uids={ selectedUids } blockType={ blockType } firstIndex={ 0 } /> );
			expect( blockMover.hasClass( 'editor-block-mover' ) ).toBe( true );

			const moveUp = blockMover.childAt( 0 );
			const moveDown = blockMover.childAt( 1 );
			expect( moveUp.type().name ).toBe( 'IconButton' );
			expect( moveDown.type().name ).toBe( 'IconButton' );
			expect( moveUp.props() ).toMatchObject( {
				className: 'editor-block-mover__control',
				onClick: undefined,
				label: 'Move 2 blocks from position 1 up by one place',
				'aria-disabled': undefined,
			} );
			expect( moveDown.props() ).toMatchObject( {
				className: 'editor-block-mover__control',
				onClick: undefined,
				label: 'Move 2 blocks from position 1 down by one place',
				'aria-disabled': undefined,
			} );
		} );

		it( 'should render the up arrow with a onMoveUp callback', () => {
			const onMoveUp = ( event ) => event;
			const blockMover = shallow(
				<BlockMover uids={ selectedUids }
					blockType={ blockType }
					onMoveUp={ onMoveUp }
					firstIndex={ 0 } />
			);
			const moveUp = blockMover.childAt( 0 );
			expect( moveUp.prop( 'onClick' ) ).toBe( onMoveUp );
		} );

		it( 'should render the down arrow with a onMoveDown callback', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow(
				<BlockMover uids={ selectedUids }
					blockType={ blockType }
					onMoveDown={ onMoveDown }
					firstIndex={ 0 } />
			);
			const moveDown = blockMover.childAt( 1 );
			expect( moveDown.prop( 'onClick' ) ).toBe( onMoveDown );
		} );

		it( 'should render with a disabled up arrown when the block isFirst', () => {
			const onMoveUp = ( event ) => event;
			const blockMover = shallow(
				<BlockMover uids={ selectedUids }
					blockType={ blockType }
					onMoveUp={ onMoveUp }
					isFirst
					firstIndex={ 0 } />
			);
			const moveUp = blockMover.childAt( 0 );
			expect( moveUp.props() ).toMatchObject( {
				onClick: null,
				'aria-disabled': true,
			} );
		} );

		it( 'should render with a disabled down arrow when the block isLast', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow(
				<BlockMover uids={ selectedUids }
					blockType={ blockType }
					onMoveDown={ onMoveDown }
					isLast
					firstIndex={ 0 } />
			);
			const moveDown = blockMover.childAt( 1 );
			expect( moveDown.props() ).toMatchObject( {
				onClick: null,
				'aria-disabled': true,
			} );
		} );
	} );
} );
