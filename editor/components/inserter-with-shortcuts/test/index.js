/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * WordPress dependencies
 */
import { getBlockType, registerCoreBlocks } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import { InserterWithShortcuts } from '../';

describe( 'InserterWithShortcuts', () => {
	beforeAll( () => {
		registerCoreBlocks();
	} );

	it( 'should show controls when receiving focus', () => {
		const clearSelectedBlock = jest.fn();
		const wrapper = shallow( <InserterWithShortcuts clearSelectedBlock={ clearSelectedBlock } /> );

		wrapper.simulate( 'focus' );

		expect( wrapper.state( 'isShowingControls' ) ).toBe( true );
		expect( clearSelectedBlock ).toHaveBeenCalled();
	} );

	it( 'should hide controls when losing focus', () => {
		const wrapper = shallow( <InserterWithShortcuts /> );

		wrapper.simulate( 'focus' );
		wrapper.simulate( 'blur' );

		expect( wrapper.state( 'isShowingControls' ) ).toBe( false );
	} );

	it( 'should insert frequently used blocks', () => {
		const insertBlock = jest.fn();
		const mostFrequentlyUsedBlocks = [ getBlockType( 'core/paragraph' ), getBlockType( 'core/image' ) ];
		const wrapper = shallow(
			<InserterWithShortcuts insertBlock={ insertBlock } mostFrequentlyUsedBlocks={ mostFrequentlyUsedBlocks } />
		);
		wrapper.state.preferences = {
			blockUsage: {
				'core/paragraph': 42,
				'core/image': 34,
			},
		};

		wrapper
			.findWhere( ( node ) => node.prop( 'children' ) === 'Paragraph' )
			.simulate( 'click' );

		expect( insertBlock ).toHaveBeenCalled();
		expect( insertBlock.mock.calls[ 0 ][ 0 ].name ).toBe( 'core/paragraph' );
	} );
} );
