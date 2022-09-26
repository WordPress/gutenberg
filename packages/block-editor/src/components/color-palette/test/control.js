/**
 * External dependencies
 */
import { create, act } from 'react-test-renderer';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../control';

const noop = () => {};

describe( 'ColorPaletteControl', () => {
	it( 'matches the snapshot', async () => {
		let root;

		await act( async () => {
			root = create(
				<ColorPaletteControl
					label="Test Color"
					value="#f00"
					colors={ [ { color: '#f00', name: 'red' } ] }
					disableCustomColors={ false }
					onChange={ noop }
				/>
			);
		} );

		expect( root.toJSON() ).toMatchSnapshot();
	} );
} );
