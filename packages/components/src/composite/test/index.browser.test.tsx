import { describe, expect, it, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import {
	queryByAttribute,
	render,
	screen,
	waitFor,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { useState } from '@wordpress/element';
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

		await userEvent.tab();
		expect(
			screen.getByRole( 'button', { name: 'Before' } )
		).toHaveFocus();
		await userEvent.tab();
		expect(
			screen.getByRole( 'button', { name: 'Item 1' } )
		).toHaveFocus();
		await userEvent.tab();
		expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
		await userEvent.tab( { shift: true } );
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

		await userEvent.tab();
		expect( item1 ).toHaveFocus();
		await userEvent.keyboard( '{ArrowDown}' );
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

		await userEvent.tab();
		expect( item1 ).toHaveFocus();
		await userEvent.keyboard( '{ArrowDown}' );
		expect( item2 ).toHaveFocus();
		expect( item3 ).not.toHaveFocus();
	} );

	test( 'Supports `activeId`', async () => {
		/* eslint-disable no-restricted-syntax */
		await renderAndValidate(
			<>
				<button>Before</button>
				<Composite activeId="item-2">
					<Composite.Item id="item-1">Item 1</Composite.Item>
					<Composite.Item id="item-2">Item 2</Composite.Item>
					<Composite.Item id="item-3">Item 3</Composite.Item>
				</Composite>
			</>
		);
		/* eslint-enable no-restricted-syntax */

		const item2 = screen.getByRole( 'button', { name: 'Item 2' } );

		await userEvent.click(
			screen.getByRole( 'button', { name: 'Before' } )
		);
		await userEvent.tab();
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

		await userEvent.tab();
		await userEvent.tab();

		expect(
			screen.getByRole( 'button', { name: 'Item 1' } )
		).toHaveFocus();

		await userEvent.keyboard( '{ArrowRight}' );
		await userEvent.keyboard( '{ArrowRight}' );

		expect(
			screen.getByRole( 'button', { name: 'Item 3' } )
		).toHaveFocus();

		await userEvent.click( toggleButton );

		expect(
			screen.queryByRole( 'button', { name: 'Item 3' } )
		).not.toBeInTheDocument();

		await userEvent.tab( { shift: true } );

		expect(
			screen.getByRole( 'button', { name: 'Item 2' } )
		).toHaveFocus();

		await userEvent.click( toggleButton );

		expect(
			screen.getByRole( 'button', { name: 'Item 3' } )
		).toBeVisible();

		await userEvent.tab( { shift: true } );

		expect(
			screen.getByRole( 'button', { name: 'Item 2' } )
		).toHaveFocus();

		await userEvent.keyboard( '{ArrowRight}' );

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

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{End}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{Home}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{PageDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{PageUp}' );
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

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{End}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{Home}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{PageDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{PageUp}' );
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

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{End}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{Home}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{PageDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{PageUp}' );
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

				await userEvent.tab();
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( item3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( item1 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
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

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemB2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( itemA2 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ lastArrowKey }}` );
				expect( itemA3 ).toHaveFocus();
				await userEvent.keyboard( '{PageDown}' );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( `{${ firstArrowKey }}` );
				expect( itemC1 ).toHaveFocus();
				await userEvent.keyboard( '{PageUp}' );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{Control>}{End}{/Control}' );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( '{Control>}{Home}{/Control}' );
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

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemA2 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemA3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemC1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemA3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
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
				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemA2 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemA3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemC1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemA2 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( itemA1 ).toHaveFocus();
				itemA1.focus();
				await userEvent.keyboard( '{Control>}{End}{/Control}' );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
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

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( `{${ previousArrowKey }}` );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				expect( itemC3 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
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

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemB2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				// A2 doesn't exist
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemB2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
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

				await userEvent.tab();
				expect( itemA1 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				expect( itemB1 ).toHaveFocus();
				await userEvent.keyboard( `{${ nextArrowKey }}` );
				expect( itemB2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowUp}' );
				// A2 doesn't exist
				expect( itemB2 ).toHaveFocus();
				await userEvent.keyboard( '{ArrowDown}' );
				// C2 is disabled
				expect( itemB2 ).toHaveFocus();
			} );
		} );
	} );
} );
