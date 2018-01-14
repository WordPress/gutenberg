/**
 * External dependencies
 */
import { shallow } from 'enzyme';

/**
 * Internal dependencies
 */
import { VisualEditorInserter } from '../inserter';

describe( 'VisualEditorInserter', () => {
	it( 'should show controls when receiving focus', () => {
		const clearSelectedBlock = jest.fn();
		const wrapper = shallow(
			<VisualEditorInserter clearSelectedBlock={ clearSelectedBlock } frequentInserterItems={ [] } />
		);

		wrapper.simulate( 'focus' );

		expect( wrapper.state( 'isShowingControls' ) ).toBe( true );
		expect( clearSelectedBlock ).toHaveBeenCalled();
	} );

	it( 'should hide controls when losing focus', () => {
		const wrapper = shallow( <VisualEditorInserter frequentInserterItems={ [] } /> );

		wrapper.simulate( 'focus' );
		wrapper.simulate( 'blur' );

		expect( wrapper.state( 'isShowingControls' ) ).toBe( false );
	} );

	it( 'should insert frequently used blocks', () => {
		const insertBlock = jest.fn();
		const frequentInserterItems = [
			{ name: 'core/paragraph', title: 'Paragraph' },
			{ name: 'core/block', title: 'My block', initialAttributes: { ref: 123 } },
		];
		const wrapper = shallow(
			<VisualEditorInserter insertBlock={ insertBlock } frequentInserterItems={ frequentInserterItems } />
		);

		wrapper
			.findWhere( ( node ) => node.prop( 'children' ) === 'My block' )
			.simulate( 'click' );

		expect( insertBlock ).toHaveBeenCalled();
		expect( insertBlock.mock.calls[ 0 ][ 0 ] ).toMatchObject( {
			uid: expect.any( String ),
			name: 'core/block',
			attributes: { ref: 123 },
		} );
	} );
} );
