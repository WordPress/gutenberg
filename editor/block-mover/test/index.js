/**
 * External dependencies
 */
import { expect } from 'chai';
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { BlockMover } from '../';

describe( 'BlockMover', () => {
	describe( 'basic rendering', () => {
		it( 'should render two IconButton components with the following props', () => {
			const blockMover = shallow( <BlockMover /> );
			expect( blockMover.hasClass( 'editor-block-mover' ) );

			const moveUp = blockMover.childAt( 0 );
			const moveDown = blockMover.childAt( 1 );
			expect( moveUp.type().name ).to.equal( 'IconButton' );
			expect( moveDown.type().name ).to.equal( 'IconButton' );
			expect( moveUp.props() ).to.include( {
				className: 'editor-block-mover__control',
				onClick: undefined,
				icon: 'arrow-up-alt2',
				'aria-disabled': undefined,
			} );
			expect( moveDown.props() ).to.include( {
				className: 'editor-block-mover__control',
				onClick: undefined,
				icon: 'arrow-down-alt2',
				'aria-disabled': undefined,
			} );
		} );

		it( 'should render the up arrow with a onMoveUp callback', () => {
			const onMoveUp = ( event ) => event;
			const blockMover = shallow( <BlockMover onMoveUp={ onMoveUp } /> );
			const moveUp = blockMover.childAt( 0 );
			expect( moveUp.prop( 'onClick' ) ).to.equal( onMoveUp );
		} );

		it( 'should render the down arrow with a onMoveDown callback', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow( <BlockMover onMoveDown={ onMoveDown } /> );
			const moveDown = blockMover.childAt( 1 );
			expect( moveDown.prop( 'onClick' ) ).to.equal( onMoveDown );
		} );

		it( 'should render with a disabled up arrown when the block isFirst', () => {
			const onMoveUp = ( event ) => event;
			const blockMover = shallow( <BlockMover onMoveUp={ onMoveUp } isFirst /> );
			const moveUp = blockMover.childAt( 0 );
			expect( moveUp.props() ).to.include( {
				onClick: null,
				'aria-disabled': true,
			} );
		} );

		it( 'should render with a disabled down arrow when the block isLast', () => {
			const onMoveDown = ( event ) => event;
			const blockMover = shallow( <BlockMover onMoveDown={ onMoveDown } isLast /> );
			const moveDown = blockMover.childAt( 1 );
			expect( moveDown.props() ).to.include( {
				onClick: null,
				'aria-disabled': true,
			} );
		} );
	} );
} );
