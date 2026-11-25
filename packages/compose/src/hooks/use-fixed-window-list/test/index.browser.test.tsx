import { describe, expect, it } from 'vitest';
import { render } from 'vitest-browser-react';
import { useRef } from '@wordpress/element';
import useFixedWindowList from '..';

const itemHeight = 32;
const totalItems = 60;

function List() {
	const ref = useRef< HTMLDivElement >( null );
	const [ { start } ] = useFixedWindowList( ref, itemHeight, totalItems, {
		windowOverscan: 0,
	} );
	return (
		<div ref={ ref } style={ { height: totalItems * itemHeight } }>
			<output>{ start }</output>
		</div>
	);
}

describe( 'useFixedWindowList', () => {
	it( 'follows an ancestor that becomes scrollable after the list opens', async () => {
		await render( <div style={ { height: '400vh' } } /> );
		window.scrollTo( 0, 2 * window.innerHeight );

		const screen = await render(
			<div
				data-testid="panel"
				style={ { position: 'fixed', top: 0, overflow: 'auto' } }
			>
				<List />
			</div>
		);
		const start = screen.getByRole( 'status' );
		expect( Number( start.element().textContent ) ).toBeGreaterThan( 0 );

		const panel = screen.getByTestId( 'panel' ).element();
		panel.style.maxHeight = '160px';
		await expect.element( start ).toHaveTextContent( /^0$/ );

		panel.scrollTop = 10 * itemHeight;
		await expect.element( start ).toHaveTextContent( /^10$/ );
	} );
} );
