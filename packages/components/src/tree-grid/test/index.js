/**
 * External dependencies
 */
import { fireEvent, render, screen } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { LEFT, RIGHT } from '@wordpress/keycodes';
import { forwardRef } from '@wordpress/element';

/**
 * Internal dependencies
 */
import TreeGrid from '../';

const TestButton = forwardRef( ( { ...props }, ref ) => (
	<button { ...props } ref={ ref }></button>
) );

describe( 'TreeGrid', () => {
	const originalGetClientRects = window.Element.prototype.getClientRects;

	// `getClientRects` needs to be mocked so that `isVisible` from the `@wordpress/dom`
	// `focusable` module can pass in a JSDOM env where the DOM elements have no width/height.
	const mockedGetClientRects = jest.fn( () => [
		{
			x: 0,
			y: 0,
			width: 100,
			height: 100,
		},
	] );

	beforeAll( () => {
		window.Element.prototype.getClientRects = jest.fn(
			mockedGetClientRects
		);
	} );

	afterAll( () => {
		window.Element.prototype.getClientRects = originalGetClientRects;
	} );

	it( 'renders a table, tbody and any child elements', () => {
		const { container } = render(
			<TreeGrid>
				<tr>
					<td>Test</td>
				</tr>
			</TreeGrid>
		);

		expect( container.innerHTML ).toMatchSnapshot();
	} );

	it( 'should call onExpandRow when pressing Right Arrow on a collapsed row', () => {
		const onExpandRow = jest.fn();

		render(
			<TreeGrid onExpandRow={ onExpandRow }>
				<tr role="row" aria-expanded="true">
					<td>
						<TestButton>Row 1</TestButton>
					</td>
				</tr>
				<tr role="row" aria-expanded="false">
					<td>
						<TestButton>Row 2</TestButton>
					</td>
				</tr>
				<tr role="row" aria-expanded="true">
					<td>
						<TestButton>Row 3</TestButton>
					</td>
				</tr>
			</TreeGrid>
		);

		screen.getByText( 'Row 2' ).focus();
		const row2Element = screen.getByText( 'Row 2' ).closest( 'tr' );

		fireEvent.keyDown( screen.getByText( 'Row 2' ), {
			key: 'ArrowRight',
			keyCode: RIGHT,
			currentTarget: row2Element,
		} );

		expect( onExpandRow ).toHaveBeenCalledWith( row2Element );
	} );

	it( 'should call onCollapseRow when pressing Left Arrow on an expanded row', () => {
		const onCollapseRow = jest.fn();

		render(
			<TreeGrid onCollapseRow={ onCollapseRow }>
				<tr role="row" aria-expanded="false">
					<td>
						<TestButton>Row 1</TestButton>
					</td>
				</tr>
				<tr role="row" aria-expanded="true">
					<td>
						<TestButton>Row 2</TestButton>
					</td>
				</tr>
				<tr role="row" aria-expanded="false">
					<td>
						<TestButton>Row 3</TestButton>
					</td>
				</tr>
			</TreeGrid>
		);

		screen.getByText( 'Row 2' ).focus();
		const row2Element = screen.getByText( 'Row 2' ).closest( 'tr' );

		fireEvent.keyDown( screen.getByText( 'Row 2' ), {
			key: 'ArrowLeft',
			keyCode: LEFT,
			currentTarget: row2Element,
		} );

		expect( onCollapseRow ).toHaveBeenCalledWith( row2Element );
	} );
} );
