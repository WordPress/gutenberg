/**
 * External dependencies
 */
import ShallowRenderer from 'react-test-renderer/shallow';

/**
 * Internal dependencies
 */
import ColorPicker from '../';

describe( 'ColorPicker', () => {
	test( 'should render color picker', () => {
		const color = '#FFF';

		const renderer = new ShallowRenderer();
		renderer.render(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);

		expect( renderer.getRenderOutput() ).toMatchSnapshot();
	} );
} );
