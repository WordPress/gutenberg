/**
 * External dependencies
 */
import { render } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../control';

const noop = () => {};

describe( 'ColorPaletteControl', () => {
	it( 'matches the snapshot', async () => {
		const { container } = render(
			<ColorPaletteControl
				label="Test Color"
				value="#f00"
				colors={ [ { color: '#f00', name: 'red' } ] }
				disableCustomColors={ false }
				onChange={ noop }
			/>
		);

		expect( container ).toMatchSnapshot();
	} );
} );
