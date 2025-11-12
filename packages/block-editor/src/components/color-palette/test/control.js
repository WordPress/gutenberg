/**
 * External dependencies
 */
import { render, waitFor, queryByAttribute } from '@testing-library/react';

/**
 * Internal dependencies
 */
import ColorPaletteControl from '../control';

const noop = () => {};

async function renderAndValidate( ...renderArgs ) {
	const view = render( ...renderArgs );
	await waitFor( () => {
		const activeButton = queryByAttribute(
			'data-active-item',
			view.baseElement,
			'true'
		);
		expect( activeButton ).not.toBeNull();
	} );
	return view;
}

describe( 'ColorPaletteControl', () => {
	it( 'matches the snapshot', async () => {
		const { container } = await renderAndValidate(
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
