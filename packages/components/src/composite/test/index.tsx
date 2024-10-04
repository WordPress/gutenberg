/**
 * External dependencies
 */
import { queryByAttribute, render, screen } from '@testing-library/react';
import { click, press, waitFor } from '@ariakit/test';
import type { ComponentProps } from 'react';

/**
 * WordPress dependencies
 */
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { Composite } from '..';

// This is necessary because of how Ariakit calculates page up and
// page down. Without this, nothing has a height, and so paging up
// and down doesn't behave as expected in tests.

let clientHeightSpy: jest.SpiedGetter<
	typeof HTMLElement.prototype.clientHeight
>;

beforeAll( () => {
	clientHeightSpy = jest
		.spyOn( HTMLElement.prototype, 'clientHeight', 'get' )
		.mockImplementation( function getClientHeight( this: HTMLElement ) {
			if ( this.tagName === 'BODY' ) {
				return window.outerHeight;
			}
			return 50;
		} );
} );

afterAll( () => {
	clientHeightSpy?.mockRestore();
} );

async function renderAndValidate( ...args: Parameters< typeof render > ) {
	const view = render( ...args );
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

function RemoveItemTest( props: ComponentProps< typeof Composite > ) {
	const [ showThirdItem, setShowThirdItem ] = useState( true );
	return (
		<>
			<button>Focus trap before composite</button>
			<Composite { ...props }>
				<Composite.Item>Item 1</Composite.Item>
				<Composite.Item>Item 2</Composite.Item>
				{ showThirdItem && <Composite.Item>Item 3</Composite.Item> }
			</Composite>
			<button onClick={ () => setShowThirdItem( ( value ) => ! value ) }>
				Toggle third item
			</button>
		</>
	);
}

describe( 'Composite', () => {
	it( 'should remain focusable even when there are no elements in the DOM associated with the currently active ID', async () => {
		await renderAndValidate( <RemoveItemTest /> );

		const toggleButton = screen.getByRole( 'button', {
			name: 'Toggle third item',
		} );

		await press.Tab();
		await press.Tab();

		expect(
			screen.getByRole( 'button', { name: 'Item 1' } )
		).toHaveFocus();

		await press.ArrowRight();
		await press.ArrowRight();

		expect(
			screen.getByRole( 'button', { name: 'Item 3' } )
		).toHaveFocus();

		await click( toggleButton );

		expect(
			screen.queryByRole( 'button', { name: 'Item 3' } )
		).not.toBeInTheDocument();

		await press.ShiftTab();

		expect(
			screen.getByRole( 'button', { name: 'Item 2' } )
		).toHaveFocus();

		await click( toggleButton );

		expect(
			screen.getByRole( 'button', { name: 'Item 3' } )
		).toBeVisible();

		await press.ShiftTab();

		expect(
			screen.getByRole( 'button', { name: 'Item 2' } )
		).toHaveFocus();

		await press.ArrowRight();

		expect(
			screen.getByRole( 'button', { name: 'Item 3' } )
		).toHaveFocus();
	} );
} );
