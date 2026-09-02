import { describe, expect, it } from 'vitest';
import {
	render,
	screen,
	waitFor,
	queryByAttribute,
} from '@testing-library/react';
import ColorPaletteControl from '../control';

globalThis.wpVitest.mockMatchMedia();

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
	it( 'marks the selected color as active', async () => {
		await renderAndValidate(
			<ColorPaletteControl
				label="Test Color"
				value="#f00"
				colors={ [ { color: '#f00', name: 'red' } ] }
				disableCustomColors={ false }
				onChange={ noop }
			/>
		);

		expect( screen.getByRole( 'option', { name: 'red' } ) ).toHaveAttribute(
			'aria-selected',
			'true'
		);
	} );
} );
