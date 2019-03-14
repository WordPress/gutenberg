/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockMover } from '../';
import { upArrow, downArrow, dragHandle } from '../icons';

describe( 'BlockMover', () => {
	describe( 'basic rendering', () => {
		const selectedClientIds = [ 'IisClientId', 'IisOtherClientId' ];

		const blockType = {
			title: 'yolo-block',
		};

		it( 'should not render if the editor is locked', () => {
			const wrapper = shallow( <BlockMover isLocked /> );
			expect( wrapper.type() ).toBe( null );
		} );

		it( 'should render three icons with the following props', () => {
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					firstIndex={ 0 }
					instanceId={ 1 } />
			);
			expect( blockMover.hasClass( 'block-editor-block-mover' ) ).toBe( true );

			const moveUp = blockMover.childAt( 0 );
			const drag = blockMover.childAt( 1 );
			const moveDown = blockMover.childAt( 2 );
			const moveUpDesc = blockMover.childAt( 3 );
			const moveDownDesc = blockMover.childAt( 4 );
			expect( moveUp.name() ).toBe( 'ForwardRef(IconButton)' );
			expect( drag.type().name ).toBe( 'IconDragHandle' );
			expect( moveDown.name() ).toBe( 'ForwardRef(IconButton)' );
			expect( moveUp.props() ).toMatchObject( {
				className: 'editor-block-mover__control block-editor-block-mover__control',
				onClick: undefined,
				label: 'Move up',
				icon: upArrow,
				'aria-disabled': undefined,
				'aria-describedby': 'block-editor-block-mover__up-description-1',
			} );
			expect( drag.props() ).toMatchObject( {
				className: 'editor-block-mover__control block-editor-block-mover__control',
				icon: dragHandle,
			} );
			expect( moveDown.props() ).toMatchObject( {
				className: 'editor-block-mover__control block-editor-block-mover__control',
				onClick: undefined,
				label: 'Move down',
				icon: downArrow,
				'aria-disabled': undefined,
				'aria-describedby': 'block-editor-block-mover__down-description-1',
			} );
			expect( moveUpDesc.text() ).toBe( 'Move 2 blocks from position 1 up by one place' );
			expect( moveDownDesc.text() ).toBe( 'Move 2 blocks from position 1 down by one place' );
		} );

		it( 'should render the up arrow with a onMoveUp callback', () => {
			const onMoveUp = ( event ) => event;
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					onMoveUp={ onMoveUp }
					firstIndex={ 0 }
				/>
			);
			const moveUp = blockMover.childAt( 0 );
			expect( moveUp.prop( 'onClick' ) ).toBe( onMoveUp );
		} );

		it( 'should render the drag handle with onDragStart and onDragEnd callback', () => {
			const onDragStart = ( event ) => event;
			const onDragEnd = ( event ) => event;
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					onDragStart={ onDragStart }
					onDragEnd={ onDragEnd }
					firstIndex={ 0 }
				/>
			);
			const dragHandler = blockMover.childAt( 1 );
			expect( dragHandler.prop( 'onDragStart' ) ).toBe( onDragStart );
			expect( dragHandler.prop( 'onDragEnd' ) ).toBe( onDragEnd );
		} );

		it( 'should render the down arrow with a onMoveDown callback', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					onMoveDown={ onMoveDown }
					firstIndex={ 0 }
				/>
			);
			const moveDown = blockMover.childAt( 2 );
			expect( moveDown.prop( 'onClick' ) ).toBe( onMoveDown );
		} );

		it( 'should not render the drag handle if block is not draggable', () => {
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					isDraggable={ false }
				/>
			);
			const dragHandler = blockMover.childAt( 1 );
			expect( dragHandler.type().name ).toBe( 'IconDragHandle' );
			expect( dragHandler.prop( 'isVisible' ) ).toBe( false );
		} );

		it( 'should render with a disabled down arrow when the block isLast', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow(
				<BlockMover
					clientIds={ selectedClientIds }
					blockType={ blockType }
					onMoveDown={ onMoveDown }
					isLast
					firstIndex={ 0 }
				/>
			);
			const moveDown = blockMover.childAt( 2 );
			expect( moveDown.props() ).toMatchObject( {
				onClick: null,
				'aria-disabled': true,
			} );
		} );
	} );
} );
