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

describe( 'Composite', () => {
	let clientHeightSpy: jest.SpiedGetter<
		typeof HTMLElement.prototype.clientHeight
	>;

	beforeAll( () => {
		// This is necessary because of how Ariakit calculates page up and
		// page down. Without this, nothing has a height, and so paging up
		// and down doesn't behave as expected in tests.
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

	test( 'Renders as a single tab stop', async () => {
		await renderAndValidate(
			<>
				<button>Before</button>
				<Composite>
					<Composite.Item>Item 1</Composite.Item>
					<Composite.Item>Item 2</Composite.Item>
					<Composite.Item>Item 3</Composite.Item>
				</Composite>
				<button>After</button>
			</>
		);

		await press.Tab();
		expect(
			screen.getByRole( 'button', { name: 'Before' } )
		).toHaveFocus();
		await press.Tab();
		expect(
			screen.getByRole( 'button', { name: 'Item 1' } )
		).toHaveFocus();
		await press.Tab();
		expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
		await press.ShiftTab();
		expect(
			screen.getByRole( 'button', { name: 'Item 1' } )
		).toHaveFocus();
	} );

	test( 'Excludes disabled items', async () => {
		await renderAndValidate(
			<Composite>
				<Composite.Item>Item 1</Composite.Item>
				<Composite.Item disabled>Item 2</Composite.Item>
				<Composite.Item>Item 3</Composite.Item>
			</Composite>
		);

		const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
		const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
		const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

		expect( item2 ).toBeDisabled();

		await press.Tab();
		expect( item1 ).toHaveFocus();
		await press.ArrowDown();
		expect( item2 ).not.toHaveFocus();
		expect( item3 ).toHaveFocus();
	} );

	test( 'Includes focusable disabled items', async () => {
		await renderAndValidate(
			<Composite>
				<Composite.Item>Item 1</Composite.Item>
				<Composite.Item disabled accessibleWhenDisabled>
					Item 2
				</Composite.Item>
				<Composite.Item>Item 3</Composite.Item>
			</Composite>
		);

		const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
		const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
		const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

		expect( item2 ).toBeEnabled();
		expect( item2 ).toHaveAttribute( 'aria-disabled', 'true' );

		await press.Tab();
		expect( item1 ).toHaveFocus();
		await press.ArrowDown();
		expect( item2 ).toHaveFocus();
		expect( item3 ).not.toHaveFocus();
	} );

	test( 'Supports `activeId`', async () => {
		/* eslint-disable no-restricted-syntax */
		await renderAndValidate(
			<Composite activeId="item-2">
				<Composite.Item id="item-1">Item 1</Composite.Item>
				<Composite.Item id="item-2">Item 2</Composite.Item>
				<Composite.Item id="item-3">Item 3</Composite.Item>
			</Composite>
		);
		/* eslint-enable no-restricted-syntax */

		const item2 = screen.getByRole( 'button', { name: 'Item 2' } );

		await press.Tab();
		await waitFor( () => expect( item2 ).toHaveFocus() );
	} );

	it( 'should remain focusable even when there are no elements in the DOM associated with the currently active ID', async () => {
		const RemoveItemTest = (
			props: ComponentProps< typeof Composite >
		) => {
			const [ showThirdItem, setShowThirdItem ] = useState( true );
			return (
				<>
					<button>Focus trap before composite</button>
					<Composite { ...props }>
						<Composite.Item>Item 1</Composite.Item>
						<Composite.Item>Item 2</Composite.Item>
						{ showThirdItem && (
							<Composite.Item>Item 3</Composite.Item>
						) }
					</Composite>
					<button
						onClick={ () =>
							setShowThirdItem( ( value ) => ! value )
						}
					>
						Toggle third item
					</button>
				</>
			);
		};

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

	describe.each( [
		[ 'When LTR', false ],
		[ 'When RTL', true ],
	] )( '%s', ( _when, rtl ) => {
		const previousArrowKey = rtl ? 'ArrowRight' : 'ArrowLeft';
		const nextArrowKey = rtl ? 'ArrowLeft' : 'ArrowRight';
		const firstArrowKey = rtl ? 'End' : 'Home';
		const lastArrowKey = rtl ? 'Home' : 'End';

		describe( 'In one dimension', () => {
			test( 'All directions work with no orientation', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl }>
						<Composite.Item>Item 1</Composite.Item>
						<Composite.Item>Item 2</Composite.Item>
						<Composite.Item>Item 3</Composite.Item>
					</Composite>
				);

				const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
				const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
				const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

				await press.Tab();
				expect( item1 ).toHaveFocus();
				await press.ArrowDown();
				expect( item2 ).toHaveFocus();
				await press.ArrowDown();
				expect( item3 ).toHaveFocus();
				await press.ArrowDown();
				expect( item3 ).toHaveFocus();
				await press.ArrowUp();
				expect( item2 ).toHaveFocus();
				await press.ArrowUp();
				expect( item1 ).toHaveFocus();
				await press.ArrowUp();
				expect( item1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item2 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item3 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item2 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item1 ).toHaveFocus();
				await press.End();
				expect( item3 ).toHaveFocus();
				await press.Home();
				expect( item1 ).toHaveFocus();
				await press.PageDown();
				expect( item3 ).toHaveFocus();
				await press.PageUp();
				expect( item1 ).toHaveFocus();
			} );

			test( 'Only left/right work with horizontal orientation', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } orientation="horizontal">
						<Composite.Item>Item 1</Composite.Item>
						<Composite.Item>Item 2</Composite.Item>
						<Composite.Item>Item 3</Composite.Item>
					</Composite>
				);

				const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
				const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
				const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

				await press.Tab();
				expect( item1 ).toHaveFocus();
				await press.ArrowDown();
				expect( item1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item2 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item3 ).toHaveFocus();
				await press.ArrowUp();
				expect( item3 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item2 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item1 ).toHaveFocus();
				await press.End();
				expect( item3 ).toHaveFocus();
				await press.Home();
				expect( item1 ).toHaveFocus();
				await press.PageDown();
				expect( item3 ).toHaveFocus();
				await press.PageUp();
				expect( item1 ).toHaveFocus();
			} );

			test( 'Only up/down work with vertical orientation', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } orientation="vertical">
						<Composite.Item>Item 1</Composite.Item>
						<Composite.Item>Item 2</Composite.Item>
						<Composite.Item>Item 3</Composite.Item>
					</Composite>
				);

				const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
				const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
				const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

				await press.Tab();
				expect( item1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item1 ).toHaveFocus();
				await press.ArrowDown();
				expect( item2 ).toHaveFocus();
				await press.ArrowDown();
				expect( item3 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item3 ).toHaveFocus();
				await press.ArrowUp();
				expect( item2 ).toHaveFocus();
				await press.ArrowUp();
				expect( item1 ).toHaveFocus();
				await press.End();
				expect( item3 ).toHaveFocus();
				await press.Home();
				expect( item1 ).toHaveFocus();
				await press.PageDown();
				expect( item3 ).toHaveFocus();
				await press.PageUp();
				expect( item1 ).toHaveFocus();
			} );

			test( 'Focus wraps with loop enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } focusLoop>
						<Composite.Item>Item 1</Composite.Item>
						<Composite.Item>Item 2</Composite.Item>
						<Composite.Item>Item 3</Composite.Item>
					</Composite>
				);

				const item1 = screen.getByRole( 'button', { name: 'Item 1' } );
				const item2 = screen.getByRole( 'button', { name: 'Item 2' } );
				const item3 = screen.getByRole( 'button', { name: 'Item 3' } );

				await press.Tab();
				expect( item1 ).toHaveFocus();
				await press.ArrowDown();
				expect( item2 ).toHaveFocus();
				await press.ArrowDown();
				expect( item3 ).toHaveFocus();
				await press.ArrowDown();
				expect( item1 ).toHaveFocus();
				await press.ArrowUp();
				expect( item3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( item1 ).toHaveFocus();
				await press( previousArrowKey );
				expect( item3 ).toHaveFocus();
			} );
		} );

		describe( 'In two dimensions', () => {
			test( 'All directions work as standard', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl }>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
							<Composite.Item>Item A2</Composite.Item>
							<Composite.Item>Item A3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
							<Composite.Item>Item B3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item>Item C2</Composite.Item>
							<Composite.Item>Item C3</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemA2 = screen.getByRole( 'button', {
					name: 'Item A2',
				} );
				const itemA3 = screen.getByRole( 'button', {
					name: 'Item A3',
				} );
				const itemB1 = screen.getByRole( 'button', {
					name: 'Item B1',
				} );
				const itemB2 = screen.getByRole( 'button', {
					name: 'Item B2',
				} );
				const itemC1 = screen.getByRole( 'button', {
					name: 'Item C1',
				} );
				const itemC3 = screen.getByRole( 'button', {
					name: 'Item C3',
				} );

				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press.ArrowUp();
				expect( itemA1 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemA1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemB1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemB2 ).toHaveFocus();
				await press.ArrowUp();
				expect( itemA2 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemA1 ).toHaveFocus();
				await press( lastArrowKey );
				expect( itemA3 ).toHaveFocus();
				await press.PageDown();
				expect( itemC3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemC3 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemC3 ).toHaveFocus();
				await press( firstArrowKey );
				expect( itemC1 ).toHaveFocus();
				await press.PageUp();
				expect( itemA1 ).toHaveFocus();
				await press.End( null, { ctrlKey: true } );
				expect( itemC3 ).toHaveFocus();
				await press.Home( null, { ctrlKey: true } );
				expect( itemA1 ).toHaveFocus();
			} );

			test( 'Focus wraps around rows/columns with loop enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } focusLoop>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
							<Composite.Item>Item A2</Composite.Item>
							<Composite.Item>Item A3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
							<Composite.Item>Item B3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item>Item C2</Composite.Item>
							<Composite.Item>Item C3</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemA2 = screen.getByRole( 'button', {
					name: 'Item A2',
				} );
				const itemA3 = screen.getByRole( 'button', {
					name: 'Item A3',
				} );
				const itemB1 = screen.getByRole( 'button', {
					name: 'Item B1',
				} );
				const itemC1 = screen.getByRole( 'button', {
					name: 'Item C1',
				} );
				const itemC3 = screen.getByRole( 'button', {
					name: 'Item C3',
				} );

				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA2 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemB1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemC1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemA1 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemA3 ).toHaveFocus();
				await press.ArrowUp();
				expect( itemC3 ).toHaveFocus();
			} );

			test( 'Focus moves between rows/columns with wrap enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } focusWrap>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
							<Composite.Item>Item A2</Composite.Item>
							<Composite.Item>Item A3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
							<Composite.Item>Item B3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item>Item C2</Composite.Item>
							<Composite.Item>Item C3</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemA2 = screen.getByRole( 'button', {
					name: 'Item A2',
				} );
				const itemA3 = screen.getByRole( 'button', {
					name: 'Item A3',
				} );
				const itemB1 = screen.getByRole( 'button', {
					name: 'Item B1',
				} );
				const itemC1 = screen.getByRole( 'button', {
					name: 'Item C1',
				} );
				const itemC3 = screen.getByRole( 'button', {
					name: 'Item C3',
				} );
				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA2 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemB1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemC1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemA2 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemA1 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemA1 ).toHaveFocus();
				await press.ArrowUp();
				expect( itemA1 ).toHaveFocus();
				await press.End( itemA1, { ctrlKey: true } );
				expect( itemC3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemC3 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemC3 ).toHaveFocus();
			} );

			test( 'Focus wraps around start/end with loop and wrap enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } focusLoop focusWrap>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
							<Composite.Item>Item A2</Composite.Item>
							<Composite.Item>Item A3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
							<Composite.Item>Item B3</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item>Item C2</Composite.Item>
							<Composite.Item>Item C3</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemC3 = screen.getByRole( 'button', {
					name: 'Item C3',
				} );

				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press( previousArrowKey );
				expect( itemC3 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemA1 ).toHaveFocus();
				await press.ArrowUp();
				expect( itemC3 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemA1 ).toHaveFocus();
			} );

			test( 'Focus shifts if vertical neighbor unavailable when shift enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl } focusShift>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item disabled>Item C2</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemB1 = screen.getByRole( 'button', {
					name: 'Item B1',
				} );
				const itemB2 = screen.getByRole( 'button', {
					name: 'Item B2',
				} );
				const itemC1 = screen.getByRole( 'button', {
					name: 'Item C1',
				} );

				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemB1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemB2 ).toHaveFocus();
				await press.ArrowUp();
				// A2 doesn't exist
				expect( itemA1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemB1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemB2 ).toHaveFocus();
				await press.ArrowDown();
				// C2 is disabled
				expect( itemC1 ).toHaveFocus();
			} );

			test( 'Focus does not shift if vertical neighbor unavailable when shift not enabled', async () => {
				await renderAndValidate(
					<Composite rtl={ rtl }>
						<Composite.Row>
							<Composite.Item>Item A1</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item B1</Composite.Item>
							<Composite.Item>Item B2</Composite.Item>
						</Composite.Row>
						<Composite.Row>
							<Composite.Item>Item C1</Composite.Item>
							<Composite.Item disabled>Item C2</Composite.Item>
						</Composite.Row>
					</Composite>
				);

				const itemA1 = screen.getByRole( 'button', {
					name: 'Item A1',
				} );
				const itemB1 = screen.getByRole( 'button', {
					name: 'Item B1',
				} );
				const itemB2 = screen.getByRole( 'button', {
					name: 'Item B2',
				} );

				await press.Tab();
				expect( itemA1 ).toHaveFocus();
				await press.ArrowDown();
				expect( itemB1 ).toHaveFocus();
				await press( nextArrowKey );
				expect( itemB2 ).toHaveFocus();
				await press.ArrowUp();
				// A2 doesn't exist
				expect( itemB2 ).toHaveFocus();
				await press.ArrowDown();
				// C2 is disabled
				expect( itemB2 ).toHaveFocus();
			} );
		} );
	} );
} );
