/**
 * External dependencies
 */
import TestRenderer from 'react-test-renderer';

/**
 * Internal dependencies
 */
import ColorPicker from '../';

describe( 'ColorPicker', () => {
	test( 'should render color picker', () => {
		const color = '#FFF';

		const renderer = TestRenderer.create(
			<ColorPicker
				color={ color }
				onChangeComplete={ () => {} }
				disableAlpha
			/>
		);

		expect( renderer.toJSON() ).toMatchSnapshot();
	} );
} );
