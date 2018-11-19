/**
 * External dependencies.
 */
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies.
 */
import { PluginBlockSettingsMenuGroupSlot } from '../plugin-block-settings-menu-group';

describe( 'PluginBlockSettingsMenuGroupSlot', () => {
	test( 'should render normally if block selected has name property', () => {
		const renderer = new ShallowRenderer();
		renderer.render(
			<PluginBlockSettingsMenuGroupSlot selectedBlocks={ [ { name: 'paragraph' } ] } />
		);

		expect( renderer.getRenderOutput() ).toMatchSnapshot();
	} );

	test( 'should be hidden if no block is selected', () => {
		const renderer = new ShallowRenderer();
		renderer.render(
			<PluginBlockSettingsMenuGroupSlot selectedBlocks={ [ null ] } />
		);

		expect( renderer.getRenderOutput() ).toBeNull();
	} );

	test( 'should be hidden if block selected has no name declared', () => {
		const renderer = new ShallowRenderer();
		renderer.render(
			<PluginBlockSettingsMenuGroupSlot selectedBlocks={ [ {} ] } />
		);

		expect( renderer.getRenderOutput() ).toBeNull();
	} );
} );
